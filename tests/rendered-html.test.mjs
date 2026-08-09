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

test("renders an anonymous editorial homepage with only completed city guides", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>旅策｜把零散经验整理成可直接执行的城市攻略<\/title>/);
  for (const [city, slug] of [["杭州", "hangzhou"], ["成都", "chengdu"], ["北京", "beijing"]]) {
    assert.match(html, new RegExp(`href="/city/${slug}"[\\s\\S]{0,800}${city}`));
  }
  assert.match(html, /EDITORIAL CITY GUIDES[\s\S]{0,80}3/);
  assert.match(html, /攻略先解决真实问题/);
  assert.match(html, /把餐厅放进路线/);
  assert.doesNotMatch(html, /哈尔滨|苏州|武汉|深圳|丽江|敦煌|香港/);
  assert.doesNotMatch(html, /京都|KYOTO|signin-with-chatgpt|路线 API 待接入|地图调用次数|DeepSeek 待接入|搜索待接入|等待搜索 API|0 次搜索|缓存 24 小时|成本控制|DEMO MODE|AI预算估算|待配置/);
  assert.doesNotMatch(html, /穷游|经济|适中|舒适|奢华|控制花费|体验均衡|时间优先|预算百分比|住宿占比|餐饮占比/);
});

test("keeps consecutive static homepage renders deterministic", async () => {
  const worker = await getWorker();
  const request = () => new Request("http://localhost/", { headers: { accept: "text/html" } });
  const firstHtml = await (await worker.fetch(request(), env, ctx)).text();
  await new Promise((resolve) => setTimeout(resolve, 25));
  const secondHtml = await (await worker.fetch(request(), env, ctx)).text();

  assert.equal(secondHtml, firstHtml);
  assert.match(firstHtml, /把零散经验/);

  const [citiesSource, pageSource, guideSource] = await Promise.all([
    readFile(new URL("../lib/cities.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/editorial-city-guides.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(citiesSource, /searchedAt:\s*new Date\s*\(/);
  assert.doesNotMatch(pageSource, /toLocale(?:String|DateString|TimeString)\s*\(/);
  assert.doesNotMatch(guideSource, /Date\.now|new Date\s*\(|Math\.random/);
  assert.doesNotMatch(pageSource, /api-stack|live-data-strip|\/api\/ai\/status|\/api\/data\/status/);
});

test("serves independent shareable Hangzhou, Chengdu and Beijing pages", async () => {
  const worker = await getWorker();
  const pages = {};
  for (const [slug, city] of [["hangzhou", "杭州"], ["chengdu", "成都"], ["beijing", "北京"]]) {
    const response = await worker.fetch(new Request(`http://localhost/city/${slug}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200);
    const html = await response.text();
    pages[slug] = html;
    assert.match(html, new RegExp(`<title>${city}实用旅行攻略｜旅策<\\/title>`));
    assert.match(html, new RegExp(`${city}[345]日`));
    assert.match(html, /旅行者真正会遇到的问题/);
    assert.match(html, /你想要哪一种攻略/);
    assert.match(html, /太累时先删/);
    assert.match(html, /餐厅必须放进具体一天/);
    assert.match(html, /下雨、节假日和特殊情况/);
    assert.match(html, /<details class="source-details editorial-sources">/);
    assert.doesNotMatch(html, /穷游|经济|适中|舒适|奢华|控制花费|体验均衡|时间优先|TRIP BUDGET|预计¥\s?\d/);
  }
  assert.match(pages.hangzhou, /灵隐与梅灵/);
  assert.doesNotMatch(pages.hangzhou, /成都大熊猫|故宫博物院/);
  assert.match(pages.chengdu, /熊猫要早/);
  assert.doesNotMatch(pages.chengdu, /灵隐飞来峰|故宫博物院/);
  assert.match(pages.beijing, /故宫只做一件大事/);
  assert.doesNotMatch(pages.beijing, /灵隐飞来峰|陈麻婆豆腐/);

  const unknown = await worker.fetch(new Request("http://localhost/city/kyoto", { headers: { accept: "text/html" } }), env, ctx);
  const unknownHtml = await unknown.text();
  assert.match(unknownHtml, /完整攻略还没整理好/);
  assert.doesNotMatch(unknownHtml, /湖山、茶香与城市日常|北山街—白堤/);
});

test("shows ticket and dynamic facts only with a reliable source and checked date", async () => {
  const { canShowBookingInfo, canShowOpeningInfo, canShowTicketPrice, isSpecificEvidenceSource, publicFacingText, visibleBudgetItems } = await import(new URL("../lib/public-trip.ts", import.meta.url));
  const source = { title: "示例景区官方网站", url: "https://example.gov.cn/tickets", queriedAt: "2026-08-08T00:00:00+08:00" };
  const reliable = {
    ticketReference: "¥40—60",
    ticketSource: source,
    ticketCheckedAt: source.queriedAt,
    priceType: "官方公开价",
    openingHours: "08:30—17:00",
    openingSource: source,
    openingCheckedAt: source.queriedAt,
    bookingNote: "实名预约",
    bookingSource: source,
    bookingCheckedAt: source.queriedAt,
  };
  assert.equal(canShowTicketPrice(reliable), true);
  assert.equal(canShowOpeningInfo(reliable), true);
  assert.equal(canShowBookingInfo(reliable), true);
  assert.equal(canShowTicketPrice({ ...reliable, ticketSource: undefined }), false);
  assert.equal(canShowTicketPrice({ ...reliable, ticketCheckedAt: undefined }), false);
  assert.equal(canShowTicketPrice({ ...reliable, ticketReference: "出发前待核验" }), false);
  assert.equal(canShowTicketPrice({ ...reliable, ticketReference: "0元", priceType: "联网搜索参考价" }), false);
  assert.equal(canShowTicketPrice({ ...reliable, priceType: "AI预算估算" }), false);
  assert.equal(canShowOpeningInfo({ ...reliable, openingHours: "暂无" }), false);
  assert.equal(canShowBookingInfo({ ...reliable, bookingNote: "待搜索" }), false);
  assert.equal(isSpecificEvidenceSource(source), true);
  assert.equal(isSpecificEvidenceSource({ ...source, url: "https://example.gov.cn/" }), false);

  const budget = [
    { category: "住宿", amount: "¥800", percent: 42 },
    { category: "餐饮", amount: "¥400", percent: 24 },
    { category: "门票与体验", amount: "¥200", percent: 12 },
    { category: "机动预算", amount: "¥180", percent: 10 },
  ];
  const budgetWithoutTickets = visibleBudgetItems(budget, false);
  assert.deepEqual(budgetWithoutTickets.map((item) => item.category), ["住宿", "餐饮", "机动预算"]);
  assert.equal(budgetWithoutTickets.reduce((sum, item) => sum + item.percent, 0), 100);
  assert.equal(visibleBudgetItems(budget, true).length, 4);
  assert.equal(publicFacingText("预置城市资料 · AI预算估算"), "城市资料 · 参考预算");
  assert.doesNotMatch(publicFacingText("当前未使用实时接口，所有动态信息均待核验。"), /接口|未联网/);
});

test("ships a complete four-day Hangzhou editorial itinerary", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(jsonRequest("/api/ai/generate", {
    ...tripRequest("杭州"), days: 4,
  }), env, ctx);
  assert.equal(response.status, 200);
  const { plan } = await response.json();
  assert.equal(plan.days.length, 4);
  assert.ok(plan.days.every((day) => day.area && day.arrangementReason && day.optionalToDrop));
  assert.ok(plan.days.every((day) => day.costItems.some((item) => item.label === "当日合计")));
  assert.ok(plan.days.every((day) => day.stops.some((stop) => /午餐/.test(stop.title))));
  assert.ok(plan.days.every((day) => day.stops.some((stop) => /晚餐/.test(stop.title) || /晚餐/.test(stop.meta))));
  assert.ok(plan.restaurants.length >= 3);
  assert.ok(plan.restaurants.every((item) => item.source?.url && item.checkedAt && item.why && item.signatureDishes.length));
  assert.ok(plan.highlights.every((item) => item.bestTime && item.pitfall));
  assert.ok(plan.preDepartureChecklist.length >= 4);
  assert.ok(plan.liveData.sources.every((source) => !/^\/(?:index(?:\.html?)?)?\/?$/i.test(new URL(source.url).pathname)));
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
    assert.ok(payload.plan.highlights.every((item) => !item.ticketReference && !item.openingHours && !item.bookingNote));
    assert.ok(payload.plan.budgetBreakdown.every((item) => !/门票|体验/.test(item.category)));
    assert.equal(payload.plan.budgetBreakdown.reduce((sum, item) => sum + item.percent, 0), 100);
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
