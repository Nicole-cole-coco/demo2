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

test("renders an anonymous China planner with 40 regional cities", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>旅策｜中国城市美食、景点、交通与预算一体规划<\/title>/);
  for (const city of ["北京", "哈尔滨", "苏州", "武汉", "深圳", "丽江", "敦煌", "香港", "宁波", "绍兴", "福州", "济南", "贵阳"]) {
    assert.match(html, new RegExp(city));
  }
  assert.match(html, /CITY COLLECTION[\s\S]{0,80}40[\s\S]{0,80}CITIES/);
  assert.match(html, /区域动线建议/);
  assert.match(html, /预置城市资料/);
  assert.doesNotMatch(html, /京都|KYOTO|signin-with-chatgpt|路线 API 待接入|地图调用次数/);
});

test("keeps consecutive static homepage renders deterministic", async () => {
  const worker = await getWorker();
  const request = () => new Request("http://localhost/", { headers: { accept: "text/html" } });
  const firstHtml = await (await worker.fetch(request(), env, ctx)).text();
  await new Promise((resolve) => setTimeout(resolve, 25));
  const secondHtml = await (await worker.fetch(request(), env, ctx)).text();

  assert.equal(secondHtml, firstHtml);
  assert.match(firstHtml, /演示资料 · 动态信息待核验/);

  const [citiesSource, pageSource] = await Promise.all([
    readFile(new URL("../lib/cities.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(citiesSource, /searchedAt:\s*new Date\s*\(/);
  assert.doesNotMatch(pageSource, /toLocale(?:String|DateString|TimeString)\s*\(/);
  assert.match(pageSource, /isRenderableTravelPlan\(value\)/);
});

test("keeps all 40 city covers unique and records image licenses", async () => {
  const citiesSource = await readFile(new URL("../lib/cities.ts", import.meta.url), "utf8");
  const images = [...citiesSource.matchAll(/image:\s*"(\/cities\/[^"]+)"/g)].map((match) => match[1]);
  assert.equal(images.length, 40);
  assert.equal(new Set(images).size, images.length);
  const manifest = JSON.parse((await readFile(new URL("../public/cities/attribution.json", import.meta.url), "utf8")).replace(/^\uFEFF/, ""));
  assert.equal(manifest.count, 26);
  for (const city of ["宁波", "绍兴", "福州", "济南", "贵阳"]) assert.ok(manifest.items.some((item) => item.city === city));
  assert.ok(manifest.items.every((item) => item.city && item.author && item.source_page && item.license && item.local_path));
  const guiyang = manifest.items.find((item) => item.city === "贵阳");
  assert.match(`${guiyang.caption} ${guiyang.file_name}`, /Jiaxiu|甲秀/i);
});

test("provides structured pre-curated knowledge for every city", async () => {
  const citiesSource = await readFile(new URL("../lib/cities.ts", import.meta.url), "utf8");
  const knowledgeSource = await readFile(new URL("../lib/city-knowledge.ts", import.meta.url), "utf8");
  const cityNames = [...citiesSource.matchAll(/city:\s*"([^"]+)"/g)].slice(0, 40).map((match) => match[1]);
  assert.equal(cityNames.length, 40);
  for (const city of cityNames) assert.match(knowledgeSource, new RegExp(`\\n\\s*${city}: \\{`));
  assert.match(knowledgeSource, /suggestedDuration/);
  assert.match(knowledgeSource, /ticketReference/);
  assert.match(knowledgeSource, /openingHours/);
  assert.match(knowledgeSource, /reservation/);
  assert.match(knowledgeSource, /stayAreas/);
  assert.match(knowledgeSource, /arrivalAccess/);
  assert.match(knowledgeSource, /2026-08-08/);
});

test("exposes only secret-safe AI and web-search status", async () => {
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
  assert.equal(data.strategy, "curated-city-data-plus-runtime-search");
  assert.equal(data.cacheTtlHours, 24);
  assert.equal(data.maxSearchQueries, 4);
  assert.equal(data.mapRoutingEnabled, false);
  assert.equal(data.paidTicketingEnabled, false);
  assert.equal("mapConfigured" in data, false);
  assert.equal("apiKey" in data, false);
});

test("generates destination-specific area plans from pre-curated data without keys", async () => {
  const worker = await getWorker();
  for (const destination of ["北京", "成都", "福州", "贵阳"]) {
    const response = await worker.fetch(jsonRequest("/api/ai/generate", tripRequest(destination)), env, ctx);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.mode, "demo");
    assert.equal(payload.plan.destination, destination);
    assert.match(payload.plan.title, new RegExp(destination));
    assert.equal(payload.plan.days.length, 2);
    assert.ok(payload.plan.days.every((day) => day.area && day.transportAdvice && day.dailyBudget));
    assert.ok(payload.plan.days.every((day) => day.stops.length >= 4 && day.stops.length <= 5));
    assert.ok(payload.plan.days.every((day) => day.stops.some((stop) => stop.time === "午餐")));
    assert.ok(payload.plan.days.every((day) => day.stops.some((stop) => stop.time === "晚餐")));
    assert.ok(payload.plan.staySuggestions.length >= 2);
    assert.equal(payload.plan.liveData.searchStatus, "off");
    assert.equal(payload.plan.liveData.queryCount, 0);
    assert.ok(payload.plan.liveData.sources.every((source) => source.queriedAt && source.url));
    assert.doesNotMatch(JSON.stringify(payload.plan), /京都|日元|高德地图参考|routeToNext/);
    assert.doesNotMatch(JSON.stringify(payload.plan.days), /\d+(?:\.\d+)?\s*(?:公里|千米|米)(?:\D|$)/);
  }
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

test("search and public ticket pricing degrade transparently without keys", async () => {
  const worker = await getWorker();
  const search = await worker.fetch(jsonRequest("/api/search/travel", { destination: "成都", originCity: "上海" }), env, ctx);
  assert.equal(search.status, 200);
  const searchPayload = await search.json();
  assert.equal(searchPayload.status, "unavailable");
  assert.deepEqual(searchPayload.sources, []);
  assert.equal(searchPayload.queryCount, 0);

  const ticket = await worker.fetch(jsonRequest("/api/ticket/estimate", { destination: "成都", poiNames: ["成都大熊猫繁育研究基地"] }), env, ctx);
  assert.equal(ticket.status, 200);
  const ticketPayload = await ticket.json();
  assert.equal(ticketPayload.status, "unavailable");
  assert.equal(ticketPayload.estimates[0].priceType, "出发前待核验");
  assert.equal(ticketPayload.message, "公开参考价，余票、优惠政策和最终支付金额请以官方页面为准。");
  assert.doesNotMatch(JSON.stringify(ticketPayload), /实时可购|保证有票|立即购买/);
});

test("does not expose first-version map routing endpoints", async () => {
  const worker = await getWorker();
  for (const pathname of ["/api/map/poi", "/api/map/route"]) {
    const response = await worker.fetch(jsonRequest(pathname, { city: "成都" }), env, ctx);
    assert.equal(response.status, 404);
  }
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

test("does not embed secrets or disabled provider configuration in client output", async () => {
  const clientRoot = path.resolve("dist/client");
  const files = (await filesUnder(clientRoot)).filter((file) => /\.(?:js|html|json|css)$/.test(file));
  const combined = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(combined, /replace_with_your_|sk-[A-Za-z0-9_-]{16,}|\.env\.local|AMAP_WEB_SERVICE_KEY|mapConfigured|路线 API 待接入/);
});
