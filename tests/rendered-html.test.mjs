import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

async function getWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

function jsonRequest(pathname, body) {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

function tripRequest(destination) {
  return {
    originCity: "上海", destination, startDate: "2026-10-23", days: 2,
    pace: "舒展", budget: "适中", transport: "公共交通优先",
    interests: ["地道美食", "历史古迹"], constraints: "少折返",
  };
}

test("renders an anonymous China planner with at least 30 regional cities", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>旅策｜中国城市美食、景点、交通与预算一体规划<\/title>/);
  for (const city of ["北京", "哈尔滨", "苏州", "武汉", "深圳", "丽江", "敦煌", "香港"]) assert.match(html, new RegExp(city));
  assert.match(html, /CITY COLLECTION[\s\S]{0,80}35[\s\S]{0,80}CITIES/);
  assert.match(html, /把特色美食安排到正确的一餐/);
  assert.doesNotMatch(html, /京都|KYOTO|signin-with-chatgpt/);
});

test("keeps every city cover unique and records new image licenses", async () => {
  const citiesSource = await readFile(new URL("../lib/cities.ts", import.meta.url), "utf8");
  const images = [...citiesSource.matchAll(/image:\s*"(\/cities\/[^"]+)"/g)].map((match) => match[1]);
  assert.ok(images.length >= 30, `expected >=30 city images, got ${images.length}`);
  assert.equal(new Set(images).size, images.length);
  const manifest = JSON.parse((await readFile(new URL("../public/cities/attribution.json", import.meta.url), "utf8")).replace(/^\uFEFF/, ""));
  assert.equal(manifest.count, 21);
  assert.ok(manifest.items.every((item) => item.city && item.author && item.source_page && item.license && item.local_path));
});

test("exposes secret-safe provider status routes", async () => {
  const worker = await getWorker();
  const aiResponse = await worker.fetch(new Request("http://localhost/api/ai/status"), env, ctx);
  assert.equal(aiResponse.status, 200);
  const ai = await aiResponse.json();
  assert.equal(ai.provider, "deepseek");
  assert.equal(typeof ai.configured, "boolean");
  assert.equal("apiKey" in ai, false);

  const dataResponse = await worker.fetch(new Request("http://localhost/api/data/status"), env, ctx);
  assert.equal(dataResponse.status, 200);
  const data = await dataResponse.json();
  assert.equal(typeof data.searchConfigured, "boolean");
  assert.equal(typeof data.mapConfigured, "boolean");
  assert.equal(data.strategy, "free-quota-first");
  assert.equal(data.cacheTtlHours, 24);
  assert.equal("apiKey" in data, false);
});

test("generates a destination-specific anonymous demo without a model key", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(jsonRequest("/api/ai/generate", tripRequest("北京")), env, ctx);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.mode, "demo");
  assert.equal(payload.plan.destination, "北京");
  assert.match(payload.plan.title, /北京/);
  assert.doesNotMatch(JSON.stringify(payload.plan), /杭州|京都|日元/);
  assert.equal(payload.plan.days.length, 2);
  assert.ok(payload.plan.days.every((day) => day.stops.length >= 3 && day.stops.length <= 5));
  assert.ok(payload.plan.days.every((day) => day.stops.some((stop) => /午餐|晚餐|美食/.test(`${stop.title}${stop.meta}`))));
  assert.equal(payload.plan.liveData.searchStatus, "off");
  assert.equal(payload.plan.liveData.mapStatus, "off");
});

test("supports aliases and blocks an overseas destination", async () => {
  const worker = await getWorker();
  const aliasResponse = await worker.fetch(jsonRequest("/api/ai/generate", tripRequest("beijing")), env, ctx);
  assert.equal(aliasResponse.status, 200);
  assert.equal((await aliasResponse.json()).plan.destination, "北京");

  const overseasResponse = await worker.fetch(jsonRequest("/api/ai/generate", tripRequest("京都")), env, ctx);
  assert.equal(overseasResponse.status, 422);
  const payload = await overseasResponse.json();
  assert.equal(payload.error, "UNSUPPORTED_DESTINATION");
  assert.match(payload.message, /中国境内城市/);
});

test("new data APIs fail transparently when external keys are absent", async () => {
  const worker = await getWorker();
  const search = await worker.fetch(jsonRequest("/api/search/travel", { destination: "成都", originCity: "上海" }), env, ctx);
  assert.equal(search.status, 200);
  const searchPayload = await search.json();
  assert.equal(searchPayload.status, "unavailable");
  assert.deepEqual(searchPayload.sources, []);

  const poi = await worker.fetch(jsonRequest("/api/map/poi", { city: "成都", keywords: ["成都大熊猫繁育研究基地"] }), env, ctx);
  assert.equal(poi.status, 200);
  assert.equal((await poi.json()).message, "地图 POI API 待接入");

  const route = await worker.fetch(jsonRequest("/api/map/route", { city: "成都", originName: "人民公园", destinationName: "武侯祠", mode: "公交" }), env, ctx);
  assert.equal(route.status, 200);
  assert.equal((await route.json()).message, "路线 API 待接入");

  const ticket = await worker.fetch(jsonRequest("/api/ticket/estimate", { destination: "成都", poiNames: ["成都大熊猫繁育研究基地"] }), env, ctx);
  assert.equal(ticket.status, 200);
  const ticketPayload = await ticket.json();
  assert.equal(ticketPayload.status, "unavailable");
  assert.equal(ticketPayload.estimates[0].priceType, "待核验");
});

test("validates generation input before provider calls", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(jsonRequest("/api/ai/generate", { destination: "杭州", days: 40 }), env, ctx);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "INVALID_REQUEST");
});

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? filesUnder(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

test("does not embed secret values or private env files in client output", async () => {
  const clientRoot = path.resolve("dist/client");
  const files = (await filesUnder(clientRoot)).filter((file) => /\.(?:js|html|json|css)$/.test(file));
  const combined = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(combined, /replace_with_your_|sk-[A-Za-z0-9_-]{16,}|\.env\.local/);
});
