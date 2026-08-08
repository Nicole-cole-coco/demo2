import type { CityProfile } from "./cities";
import type { TravelPlan, TravelRequest } from "./deepseek";

export type TravelSourceCategory = "门票与开放" | "特色美食" | "城市交通" | "预约与季节" | "往返交通";
export type PriceType = "官方公开价" | "公开参考价" | "非价格信息" | "待核验";

export type TravelSource = {
  title: string;
  url: string;
  siteName: string;
  snippet: string;
  category: TravelSourceCategory;
  publishedAt?: string;
  queriedAt: string;
  official: boolean;
  confidence: "高" | "中" | "低";
  priceType: PriceType;
};

export type TravelEvidence = {
  searchedAt: string;
  searchConfigured: boolean;
  searchProvider: string;
  cacheStatus: "live" | "cache" | "off";
  queryCount: number;
  sources: TravelSource[];
  warnings: string[];
  cityFacts?: Pick<CityProfile, "city" | "hook" | "foods" | "sights" | "transit" | "dailyBudget" | "tags">;
};

export type RouteEstimate = {
  mode: "公交" | "驾车" | "步行";
  distance: string;
  duration: string;
  cost?: string;
  source: "高德地图";
  checkedAt: string;
};

export type PoiResult = {
  name: string;
  location: string;
  address: string;
  district: string;
  source: "高德地图";
  checkedAt: string;
};

export type RouteRequest = {
  city: string;
  originName?: string;
  destinationName?: string;
  origin?: string;
  destination?: string;
  mode: "公交" | "驾车" | "步行";
};

export interface SearchProvider {
  readonly id: string;
  readonly configured: boolean;
  search(query: string, category: TravelSourceCategory): Promise<{ sources: TravelSource[]; cached: boolean }>;
}

export interface MapProvider {
  readonly id: string;
  readonly configured: boolean;
  searchPoi(city: string, keywords: string[]): Promise<PoiResult[]>;
  route(request: RouteRequest): Promise<RouteEstimate | null>;
}

type SearchCacheEntry = { expiresAt: number; sources: TravelSource[] };
type PointCacheEntry = { expiresAt: number; result: PoiResult | null };

const searchCache = new Map<string, SearchCacheEntry>();
const pointCache = new Map<string, PointCacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BOCHA_ENDPOINT = "https://api.bochaai.com/v1/web-search";
const AMAP_PLACE_ENDPOINT = "https://restapi.amap.com/v5/place/text";

function boundedInteger(rawValue: string | undefined, fallback: number, maximum: number) {
  const value = Number(rawValue);
  return Number.isInteger(value) && value > 0 ? Math.min(value, maximum) : fallback;
}

function cleanText(value: unknown, maxLength = 500) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "网页来源"; }
}

function looksOfficial(url: string, title: string, siteName: string) {
  const domain = getDomain(url);
  return domain.endsWith(".gov.cn") || domain.endsWith(".gov.hk") || domain.endsWith(".gov.mo")
    || domain.endsWith(".gov.tw") || domain.endsWith(".12306.cn")
    || /官方|政务|文旅|博物院|博物馆|管理局|交通运输|地铁|铁路12306/.test(`${title}${siteName}`);
}

function classifyPriceType(category: TravelSourceCategory, official: boolean): PriceType {
  if (category !== "门票与开放" && category !== "往返交通") return "非价格信息";
  return official ? "官方公开价" : "公开参考价";
}

async function fetchWithRetry(url: string, init: RequestInit, timeoutMs: number, retries = 1) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.ok || response.status < 500 || attempt === retries) return response;
      lastError = new Error(`外部服务返回 ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((resolve) => setTimeout(resolve, 220 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("外部服务暂不可用");
}

function parseBochaPayload(payload: unknown, category: TravelSourceCategory, queriedAt: string): TravelSource[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
  const webPages = data.webPages && typeof data.webPages === "object" ? data.webPages as Record<string, unknown> : undefined;
  const values = Array.isArray(webPages?.value) ? webPages.value : [];
  return values.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const title = cleanText(record.name ?? record.title, 180);
    const url = cleanText(record.url, 1000);
    if (!title || !/^https?:\/\//i.test(url)) return [];
    const siteName = cleanText(record.siteName, 100) || getDomain(url);
    const official = looksOfficial(url, title, siteName);
    return [{
      title, url, siteName, category, official, queriedAt,
      snippet: cleanText(record.summary ?? record.snippet, 600),
      publishedAt: cleanText(record.datePublished ?? record.dateLastCrawled, 40) || undefined,
      confidence: official ? "高" : "中",
      priceType: classifyPriceType(category, official),
    } satisfies TravelSource];
  });
}

class BochaSearchProvider implements SearchProvider {
  readonly id = "bocha";
  readonly configured: boolean;
  constructor(private readonly apiKey: string) { this.configured = Boolean(apiKey); }

  async search(query: string, category: TravelSourceCategory) {
    const cacheKey = `${this.id}:${category}:${query}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return { sources: cached.sources, cached: true };
    const queriedAt = new Date().toISOString();
    const response = await fetchWithRetry(BOCHA_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, freshness: "noLimit", summary: true, count: 8 }),
    }, 9_000);
    if (!response.ok) throw new Error(`搜索服务返回 ${response.status}`);
    const sources = parseBochaPayload(await response.json(), category, queriedAt);
    searchCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, sources });
    return { sources, cached: false };
  }
}

class DemoSearchProvider implements SearchProvider {
  readonly id = "demo";
  readonly configured = false;
  async search() { return { sources: [], cached: false }; }
}

function searchProvider() : SearchProvider {
  const providerName = (process.env.WEB_SEARCH_PROVIDER?.trim() || "bocha").toLowerCase();
  const key = process.env.WEB_SEARCH_API_KEY?.trim() || process.env.BOCHA_API_KEY?.trim() || "";
  if (providerName === "bocha" && key) return new BochaSearchProvider(key);
  return new DemoSearchProvider();
}

function formatDistance(raw: unknown) {
  const meters = Number(raw);
  if (!Number.isFinite(meters) || meters <= 0) return "";
  return meters < 1000 ? `${Math.round(meters)} 米` : `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} 公里`;
}

function formatDuration(raw: unknown) {
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `约 ${minutes} 分钟`;
  const remainder = minutes % 60;
  return `约 ${Math.floor(minutes / 60)} 小时${remainder ? ` ${remainder} 分钟` : ""}`;
}

class AmapProvider implements MapProvider {
  readonly id = "amap";
  readonly configured: boolean;
  constructor(private readonly apiKey: string) { this.configured = Boolean(apiKey); }

  private async findPoi(city: string, keyword: string): Promise<PoiResult | null> {
    const cacheKey = `${city}:${keyword}`;
    const cached = pointCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.result;
    const params = new URLSearchParams({ key: this.apiKey, keywords: keyword, region: city, city_limit: "true", page_size: "1" });
    try {
      const response = await fetchWithRetry(`${AMAP_PLACE_ENDPOINT}?${params}`, {}, 7_000);
      if (!response.ok) return null;
      const payload = await response.json() as { pois?: Array<{ name?: string; location?: string; address?: string; district?: string }> };
      const poi = payload.pois?.[0];
      const location = cleanText(poi?.location, 80);
      const result = location ? {
        name: cleanText(poi?.name, 120) || keyword, location,
        address: cleanText(poi?.address, 180), district: cleanText(poi?.district, 80),
        source: "高德地图" as const, checkedAt: new Date().toISOString(),
      } : null;
      pointCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result });
      return result;
    } catch { return null; }
  }

  async searchPoi(city: string, keywords: string[]) {
    const results = await Promise.all(keywords.slice(0, 10).map((keyword) => this.findPoi(city, keyword)));
    return results.filter((item): item is PoiResult => Boolean(item));
  }

  async route(request: RouteRequest): Promise<RouteEstimate | null> {
    const origin = request.origin || (request.originName ? (await this.findPoi(request.city, request.originName))?.location : "");
    const destination = request.destination || (request.destinationName ? (await this.findPoi(request.city, request.destinationName))?.location : "");
    if (!origin || !destination) return null;
    const endpoint = request.mode === "公交" ? "https://restapi.amap.com/v5/direction/transit/integrated"
      : request.mode === "步行" ? "https://restapi.amap.com/v5/direction/walking"
        : "https://restapi.amap.com/v5/direction/driving";
    const params = new URLSearchParams({ key: this.apiKey, origin, destination, show_fields: "cost" });
    if (request.mode === "公交") { params.set("city1", request.city); params.set("city2", request.city); }
    try {
      const response = await fetchWithRetry(`${endpoint}?${params}`, {}, 7_000);
      if (!response.ok) return null;
      const payload = await response.json() as { route?: { paths?: Array<{ distance?: string; duration?: string; cost?: string }>; transits?: Array<{ distance?: string; duration?: string; cost?: string }> } };
      const candidate = request.mode === "公交" ? payload.route?.transits?.[0] : payload.route?.paths?.[0];
      const distance = formatDistance(candidate?.distance);
      const duration = formatDuration(candidate?.duration);
      if (!distance || !duration) return null;
      const numericCost = Number(candidate?.cost);
      return { mode: request.mode, distance, duration, cost: Number.isFinite(numericCost) && numericCost > 0 ? `约 ¥${numericCost}` : undefined, source: "高德地图", checkedAt: new Date().toISOString() };
    } catch { return null; }
  }
}

class DemoMapProvider implements MapProvider {
  readonly id = "demo";
  readonly configured = false;
  async searchPoi() { return []; }
  async route() { return null; }
}

function mapProvider(): MapProvider {
  const key = process.env.AMAP_WEB_SERVICE_KEY?.trim() || "";
  return key ? new AmapProvider(key) : new DemoMapProvider();
}

export function getExternalDataStatus() {
  const search = searchProvider();
  const map = mapProvider();
  return {
    searchConfigured: search.configured, mapConfigured: map.configured,
    searchProvider: search.id, mapProvider: map.id,
    cacheTtlHours: 24,
    maxSearchQueries: boundedInteger(process.env.WEB_SEARCH_MAX_QUERIES, 4, 5),
    maxRouteLegs: boundedInteger(process.env.AMAP_MAX_ROUTE_LEGS, 12, 24),
    strategy: "free-quota-first",
  } as const;
}

function buildQueries(input: Pick<TravelRequest, "destination" | "originCity">) {
  const queries: Array<{ category: TravelSourceCategory; query: string }> = [
    { category: "门票与开放", query: `${input.destination} 景区 博物馆 官方 门票价格 开放时间 预约 临时闭馆` },
    { category: "特色美食", query: `${input.destination} 政府 文旅局 特色美食 老字号 非遗 饮食` },
    { category: "城市交通", query: `${input.destination} 地铁 公交 机场 火车站 交通 官方 运营时间` },
    { category: "预约与季节", query: `${input.destination} 文旅 官方 预约规定 节假日 季节 注意事项` },
  ];
  if (input.originCity) queries.push({ category: "往返交通", query: `${input.originCity} 到 ${input.destination} 铁路12306 高铁 飞机 时间 参考价格` });
  return queries;
}

export async function collectTravelEvidence(input: TravelRequest, profile?: CityProfile): Promise<TravelEvidence> {
  const provider = searchProvider();
  const searchedAt = new Date().toISOString();
  const cityFacts = profile ? { city: profile.city, hook: profile.hook, foods: profile.foods, sights: profile.sights, transit: profile.transit, dailyBudget: profile.dailyBudget, tags: profile.tags } : undefined;
  if (!provider.configured) {
    return { searchedAt, searchConfigured: false, searchProvider: provider.id, cacheStatus: "off", queryCount: 0, sources: [], warnings: ["联网搜索 API 尚未配置"], cityFacts };
  }
  const queries = buildQueries(input).slice(0, boundedInteger(process.env.WEB_SEARCH_MAX_QUERIES, 4, 5));
  const settled = await Promise.allSettled(queries.map(({ query, category }) => provider.search(query, category)));
  const warnings: string[] = [];
  const deduplicated = new Map<string, TravelSource>();
  let allCached = true;
  for (const result of settled) {
    if (result.status === "rejected") { warnings.push(result.reason instanceof Error ? result.reason.message : "部分联网资料暂时不可用"); continue; }
    allCached = allCached && result.value.cached;
    for (const source of result.value.sources) {
      const existing = deduplicated.get(source.url);
      if (!existing || (!existing.official && source.official)) deduplicated.set(source.url, source);
    }
  }
  const sources = [...deduplicated.values()].sort((a, b) => Number(b.official) - Number(a.official)).slice(0, 24);
  if (!sources.length) warnings.push("本次没有检索到可用网页资料，动态事实均标记待核验");
  return { searchedAt, searchConfigured: true, searchProvider: provider.id, cacheStatus: allCached ? "cache" : "live", queryCount: queries.length, sources, warnings, cityFacts };
}

export function evidenceForPrompt(evidence: TravelEvidence) {
  const maintained = evidence.cityFacts
    ? `\n[维护中的城市基础资料｜不是实时数据]\n城市：${evidence.cityFacts.city}\n城市特色：${evidence.cityFacts.hook}\n代表景点：${evidence.cityFacts.sights.join("、")}\n代表美食：${evidence.cityFacts.foods.join("、")}\n交通特点：${evidence.cityFacts.transit}\n日预算参考：${evidence.cityFacts.dailyBudget}\n`
    : "";
  if (!evidence.sources.length) return `${maintained}\n本次没有可用的联网资料。不得声称已核验实时价格、开放时间或交通状态。`;
  return `${maintained}\n${evidence.sources.map((source, index) => [
    `[资料${index + 1}｜${source.category}｜${source.official ? "官方来源" : "公开网页"}｜${source.priceType}]`,
    `标题：${source.title}`, `站点：${source.siteName}`, `摘要：${source.snippet || "无摘要"}`, `网址：${source.url}`,
  ].join("\n")).join("\n\n")}`;
}

export async function searchMapPois(city: string, keywords: string[]) {
  const provider = mapProvider();
  if (!provider.configured) return { status: "unavailable" as const, provider: provider.id, message: "地图 POI API 待接入", pois: [] as PoiResult[] };
  const pois = await provider.searchPoi(city, keywords);
  return { status: pois.length ? "live" as const : "partial" as const, provider: provider.id, message: pois.length ? undefined : "未匹配到可靠坐标", pois };
}

export async function calculateRoute(request: RouteRequest) {
  const provider = mapProvider();
  if (!provider.configured) return { status: "unavailable" as const, provider: provider.id, message: "路线 API 待接入", route: null };
  const route = await provider.route(request);
  return { status: route ? "live" as const : "partial" as const, provider: provider.id, message: route ? undefined : "本次未能计算可靠路线", route };
}

export async function estimateTickets(destination: string, poiNames: string[]) {
  const provider = searchProvider();
  const checkedAt = new Date().toISOString();
  if (!provider.configured) return {
    status: "unavailable" as const, provider: provider.id, checkedAt,
    message: "联网搜索 API 尚未配置，仅能标记待核验",
    estimates: poiNames.slice(0, 5).map((poi) => ({ poi, referencePrice: "待核验", priceType: "待核验" as PriceType, source: null })),
  };
  const results = await Promise.allSettled(poiNames.slice(0, 5).map(async (poi) => {
    const { sources } = await provider.search(`${destination} ${poi} 官方 门票 价格 预约`, "门票与开放");
    const prices = sources.flatMap((source) => [...source.snippet.matchAll(/(?:¥|￥)?\s*(\d{1,4}(?:\.\d{1,2})?)\s*元/g)].map((match) => Number(match[1]))).filter((value) => value >= 0 && value < 5000);
    const distinct = [...new Set(prices)];
    const source = sources[0] ?? null;
    return {
      poi,
      referencePrice: !distinct.length ? "待核验" : distinct.length === 1 ? `¥${distinct[0]}（网页公开参考）` : "公开资料存在价格差异，请核验官方页面",
      priceType: !source ? "待核验" as PriceType : source.official && distinct.length === 1 ? "官方公开价" as PriceType : "公开参考价" as PriceType,
      source,
    };
  }));
  return {
    status: results.some((result) => result.status === "fulfilled" && result.value.source) ? "live" as const : "partial" as const,
    provider: provider.id, checkedAt,
    message: "这里是公开网页参考价，不代表实时可购、余票或最终成交价格。",
    estimates: results.map((result, index) => result.status === "fulfilled" ? result.value : { poi: poiNames[index], referencePrice: "待核验", priceType: "待核验" as PriceType, source: null }),
  };
}

export async function enrichPlanWithRoutes(plan: TravelPlan, input: TravelRequest) {
  const provider = mapProvider();
  if (!provider.configured) return { plan, mapConfigured: false, mapProvider: provider.id, routeCount: 0, warning: "路线 API 待接入" };
  const maximumLegs = boundedInteger(process.env.AMAP_MAX_ROUTE_LEGS, 12, 24);
  const days = plan.days.map((day) => ({ ...day, stops: day.stops.map((stop) => ({ ...stop })) }));
  let attempted = 0;
  let routeCount = 0;
  const mode = input.transport === "公共交通优先" ? "公交" : input.transport === "自驾周边" ? "驾车" : "步行";
  for (const day of days) {
    for (let index = 0; index < day.stops.length - 1 && attempted < maximumLegs; index += 1) {
      attempted += 1;
      const current = day.stops[index];
      const next = day.stops[index + 1];
      const estimate = await provider.route({ city: plan.destination, originName: current.title, destinationName: next.title, mode });
      if (!estimate) continue;
      current.routeToNext = estimate;
      routeCount += 1;
    }
  }
  return { plan: { ...plan, days }, mapConfigured: true, mapProvider: provider.id, routeCount, warning: routeCount ? undefined : "本次未能匹配到可计算的景点路线" };
}
