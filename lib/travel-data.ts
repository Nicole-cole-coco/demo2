import type { CityProfile } from "./cities";
import { getCityKnowledge, type CityKnowledge } from "./city-knowledge";
import type { TravelRequest } from "./deepseek";

export type TravelSourceCategory = "门票与开放" | "预约与通知" | "城市交通" | "往返交通";
export type PriceType = "官方公开价" | "联网搜索参考价" | "非价格信息" | "出发前待核验";

export type TravelSource = {
  title: string;
  url: string;
  siteName: string;
  snippet: string;
  category: TravelSourceCategory | "城市基础资料";
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
  cacheStatus: "live" | "cache" | "mixed" | "off" | "quota";
  queryCount: number;
  sources: TravelSource[];
  warnings: string[];
  cityKnowledge?: CityKnowledge;
};

export interface SearchProvider {
  readonly id: string;
  readonly configured: boolean;
  search(query: string, category: TravelSourceCategory): Promise<{ sources: TravelSource[]; cached: boolean }>;
}

type SearchCacheEntry = { expiresAt: number; sources: TravelSource[] };
type DailyCounter = { day: string; used: number };

const searchCache = new Map<string, SearchCacheEntry>();
let dailyCounter: DailyCounter = { day: "", used: 0 };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BOCHA_ENDPOINT = "https://api.bochaai.com/v1/web-search";
const PUBLIC_PRICE_NOTICE = "公开参考价，余票、优惠政策和最终支付金额请以官方页面为准。";

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
  return official ? "官方公开价" : "联网搜索参考价";
}

function dailyLimit() {
  return boundedInteger(process.env.WEB_SEARCH_DAILY_LIMIT, 200, 10_000);
}

function reserveDailySearch() {
  const day = new Date().toISOString().slice(0, 10);
  if (dailyCounter.day !== day) dailyCounter = { day, used: 0 };
  if (dailyCounter.used >= dailyLimit()) return false;
  dailyCounter.used += 1;
  return true;
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
    if (!reserveDailySearch()) throw new Error("联网搜索已达到今日调用上限，改用预置城市资料");
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

function searchProvider(): SearchProvider {
  const providerName = (process.env.WEB_SEARCH_PROVIDER?.trim() || "bocha").toLowerCase();
  const key = process.env.WEB_SEARCH_API_KEY?.trim() || process.env.BOCHA_API_KEY?.trim() || "";
  if (providerName === "bocha" && key) return new BochaSearchProvider(key);
  return new DemoSearchProvider();
}

export function getExternalDataStatus() {
  const search = searchProvider();
  const day = new Date().toISOString().slice(0, 10);
  const usedToday = dailyCounter.day === day ? dailyCounter.used : 0;
  return {
    searchConfigured: search.configured,
    searchProvider: search.id,
    cacheTtlHours: 24,
    maxSearchQueries: boundedInteger(process.env.WEB_SEARCH_MAX_QUERIES, 4, 4),
    dailySearchLimit: dailyLimit(),
    dailySearchUsed: usedToday,
    strategy: "curated-city-data-plus-runtime-search",
    mapRoutingEnabled: false,
    paidTicketingEnabled: false,
  } as const;
}

function buildQueries(input: Pick<TravelRequest, "destination" | "originCity" | "startDate" | "days">) {
  const dateRange = `${input.startDate}起${input.days}天`;
  const queries: Array<{ category: TravelSourceCategory; query: string }> = [
    { category: "门票与开放", query: `${input.destination} ${dateRange} 景区 博物馆 官方 门票 开放时间` },
    { category: "预约与通知", query: `${input.destination} ${dateRange} 官方 预约 临时闭馆 节假日 通知 活动` },
    { category: "城市交通", query: `${input.destination} ${dateRange} 机场 火车站 公共交通 官方 出行提示` },
  ];
  if (input.originCity) queries.push({ category: "往返交通", query: `${input.originCity} 到 ${input.destination} ${dateRange} 铁路12306 高铁 飞机 耗时 公开参考价` });
  return queries;
}

export async function collectTravelEvidence(input: TravelRequest, profile?: CityProfile): Promise<TravelEvidence> {
  const provider = searchProvider();
  const searchedAt = new Date().toISOString();
  const cityKnowledge = profile ? getCityKnowledge(profile) : undefined;
  if (!provider.configured) {
    return {
      searchedAt, searchConfigured: false, searchProvider: provider.id, cacheStatus: "off",
      queryCount: 0, sources: [], warnings: ["联网搜索 API 尚未配置；动态信息均为出发前待核验"], cityKnowledge,
    };
  }
  const queries = buildQueries(input).slice(0, boundedInteger(process.env.WEB_SEARCH_MAX_QUERIES, 4, 4));
  const settled = await Promise.allSettled(queries.map(({ query, category }) => provider.search(query, category)));
  const warnings: string[] = [];
  const deduplicated = new Map<string, TravelSource>();
  let cachedCount = 0;
  let completedCount = 0;
  for (const result of settled) {
    if (result.status === "rejected") {
      warnings.push(result.reason instanceof Error ? result.reason.message : "部分联网资料暂时不可用");
      continue;
    }
    completedCount += 1;
    if (result.value.cached) cachedCount += 1;
    for (const source of result.value.sources) {
      const existing = deduplicated.get(source.url);
      if (!existing || (!existing.official && source.official)) deduplicated.set(source.url, source);
    }
  }
  const sources = [...deduplicated.values()].sort((a, b) => Number(b.official) - Number(a.official)).slice(0, 24);
  if (!sources.length) warnings.push("本次没有检索到可用动态资料，已使用城市资料库并标记待核验");
  const quotaHit = warnings.some((warning) => warning.includes("调用上限"));
  const cacheStatus = quotaHit ? "quota" : completedCount > 0 && cachedCount === completedCount ? "cache"
    : cachedCount > 0 ? "mixed" : "live";
  return { searchedAt, searchConfigured: true, searchProvider: provider.id, cacheStatus, queryCount: queries.length, sources, warnings, cityKnowledge };
}

export function evidenceForPrompt(evidence: TravelEvidence) {
  const knowledge = evidence.cityKnowledge;
  const maintained = knowledge ? [
    "[Codex 预置城市基础资料｜不是实时数据]",
    `城市：${knowledge.city}（${knowledge.province}·${knowledge.region}）`,
    `建议季节：${knowledge.recommendedSeasons.join("、")}；建议天数：${knowledge.recommendedDays}`,
    `景点与片区：${knowledge.pois.map((poi) => `${poi.name}（${poi.area}，${poi.suggestedDuration}）`).join("；")}`,
    `代表美食：${knowledge.foods.map((food) => `${food.name}（${food.meal}，${food.budget}）`).join("；")}`,
    `住宿区域：${knowledge.stayAreas.join("、")}`,
    `市内交通：${knowledge.localTransport}`,
    `进出城：${knowledge.arrivalAccess}`,
    `日预算参考：${knowledge.dailyBudget}`,
    `预置资料查询日期：${knowledge.queriedAt}`,
    "预置资料中的门票、开放和预约字段均不得当作实时结论，必须以本次搜索证据为准；无证据时写出发前待核验。",
  ].join("\n") : "";
  if (!evidence.sources.length) return `${maintained}\n\n本次没有可用的联网资料。不得声称已核验实时价格、开放时间、交通状态或临时通知。`;
  return `${maintained}\n\n${evidence.sources.map((source, index) => [
    `[动态资料${index + 1}｜${source.category}｜${source.official ? "官方来源" : "公开网页"}｜${source.priceType}]`,
    `标题：${source.title}`, `站点：${source.siteName}`, `摘要：${source.snippet || "无摘要"}`, `网址：${source.url}`,
  ].join("\n")).join("\n\n")}`;
}

export async function estimateTickets(destination: string, poiNames: string[]) {
  const provider = searchProvider();
  const checkedAt = new Date().toISOString();
  const limitedPois = poiNames.slice(0, boundedInteger(process.env.WEB_SEARCH_MAX_QUERIES, 4, 4));
  if (!provider.configured) return {
    status: "unavailable" as const, provider: provider.id, checkedAt,
    message: PUBLIC_PRICE_NOTICE,
    estimates: limitedPois.map((poi) => ({ poi, referencePrice: "出发前待核验", priceType: "出发前待核验" as PriceType, source: null })),
  };
  const results = await Promise.allSettled(limitedPois.map(async (poi) => {
    const { sources } = await provider.search(`${destination} ${poi} 官方 门票 公开价格 预约`, "门票与开放");
    const prices = sources.flatMap((source) => [...source.snippet.matchAll(/(?:¥|￥)?\s*(\d{1,4}(?:\.\d{1,2})?)\s*元/g)]
      .map((match) => Number(match[1]))).filter((value) => value >= 0 && value < 5000);
    const distinct = [...new Set(prices)];
    const source = sources[0] ?? null;
    return {
      poi,
      referencePrice: !distinct.length ? "出发前待核验" : distinct.length === 1 ? `¥${distinct[0]}（网页公开参考）` : "公开资料存在价格差异，请核验官方页面",
      priceType: !source ? "出发前待核验" as PriceType : source.official && distinct.length === 1 ? "官方公开价" as PriceType : "联网搜索参考价" as PriceType,
      source,
    };
  }));
  return {
    status: results.some((result) => result.status === "fulfilled" && result.value.source) ? "live" as const : "partial" as const,
    provider: provider.id, checkedAt, message: PUBLIC_PRICE_NOTICE,
    estimates: results.map((result, index) => result.status === "fulfilled" ? result.value : {
      poi: limitedPois[index], referencePrice: "出发前待核验", priceType: "出发前待核验" as PriceType, source: null,
    }),
  };
}

export { PUBLIC_PRICE_NOTICE };
