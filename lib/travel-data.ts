import type { TravelPlan, TravelRequest } from "./deepseek";

export type TravelSourceCategory = "门票与开放" | "特色美食" | "城市交通" | "预约与季节" | "往返交通";

export type TravelSource = {
  title: string;
  url: string;
  siteName: string;
  snippet: string;
  category: TravelSourceCategory;
  publishedAt?: string;
  official: boolean;
};

export type TravelEvidence = {
  searchedAt: string;
  searchConfigured: boolean;
  sources: TravelSource[];
  warnings: string[];
};

export type RouteEstimate = {
  mode: "公交" | "驾车";
  distance: string;
  duration: string;
  cost?: string;
  source: "高德地图";
  checkedAt: string;
};

type SearchCacheEntry = { expiresAt: number; sources: TravelSource[] };
type PointCacheEntry = { expiresAt: number; location: string | null };

const searchCache = new Map<string, SearchCacheEntry>();
const pointCache = new Map<string, PointCacheEntry>();
const SEARCH_ENDPOINT = "https://api.bochaai.com/v1/web-search";
const AMAP_PLACE_ENDPOINT = "https://restapi.amap.com/v5/place/text";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
  return domain.endsWith(".gov.cn")
    || domain.endsWith(".12306.cn")
    || /官方|政务|文旅|博物院|博物馆|管理局|交通运输|地铁/.test(`${title}${siteName}`);
}

function parseSearchPayload(payload: unknown, category: TravelSourceCategory): TravelSource[] {
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
    const snippet = cleanText(record.summary ?? record.snippet, 600);
    const publishedAt = cleanText(record.datePublished ?? record.dateLastCrawled, 40) || undefined;
    return [{ title, url, siteName, snippet, category, publishedAt, official: looksOfficial(url, title, siteName) }];
  });
}

async function searchWeb(query: string, category: TravelSourceCategory, apiKey: string) {
  const cacheKey = `${category}:${query}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.sources;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9_000);
  try {
    const response = await fetch(SEARCH_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, freshness: "noLimit", summary: true, count: 8 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`搜索服务返回 ${response.status}`);
    const sources = parseSearchPayload(await response.json(), category);
    searchCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, sources });
    return sources;
  } finally {
    clearTimeout(timer);
  }
}

export function getExternalDataStatus() {
  return {
    searchConfigured: Boolean(process.env.BOCHA_API_KEY?.trim()),
    mapConfigured: Boolean(process.env.AMAP_WEB_SERVICE_KEY?.trim()),
    strategy: "free-quota-first",
  } as const;
}

export async function collectTravelEvidence(input: TravelRequest): Promise<TravelEvidence> {
  const apiKey = process.env.BOCHA_API_KEY?.trim();
  const searchedAt = new Date().toISOString();
  if (!apiKey) {
    return { searchedAt, searchConfigured: false, sources: [], warnings: ["联网搜索 API 尚未配置"] };
  }

  const queryLimit = boundedInteger(process.env.WEB_SEARCH_MAX_QUERIES, 4, 5);
  const queries: Array<{ category: TravelSourceCategory; query: string }> = [
    { category: "门票与开放", query: `${input.destination} 旅游 景区 官方 门票价格 开放时间 预约` },
    { category: "特色美食", query: `${input.destination} 官方文旅 特色美食 老字号 非遗 饮食` },
    { category: "城市交通", query: `${input.destination} 地铁 公交 机场 火车站 交通 官方` },
    { category: "预约与季节", query: `${input.destination} 旅游 官方 预约规定 最佳季节 注意事项` },
  ];
  if (input.originCity) {
    queries.push({ category: "往返交通", query: `${input.originCity} 到 ${input.destination} 高铁 飞机 时间 票价 官方` });
  }

  const settled = await Promise.allSettled(
    queries.slice(0, queryLimit).map(({ query, category }) => searchWeb(query, category, apiKey)),
  );
  const warnings: string[] = [];
  const deduplicated = new Map<string, TravelSource>();
  for (const result of settled) {
    if (result.status === "rejected") {
      warnings.push(result.reason instanceof Error ? result.reason.message : "部分联网资料暂时不可用");
      continue;
    }
    for (const source of result.value) {
      const existing = deduplicated.get(source.url);
      if (!existing || (!existing.official && source.official)) deduplicated.set(source.url, source);
    }
  }

  const sources = [...deduplicated.values()]
    .sort((left, right) => Number(right.official) - Number(left.official))
    .slice(0, 24);
  if (!sources.length) warnings.push("本次没有检索到可用网页资料，方案未使用联网证据");
  return { searchedAt, searchConfigured: true, sources, warnings };
}

export function evidenceForPrompt(evidence: TravelEvidence) {
  if (!evidence.sources.length) return "本次没有可用的联网资料。不得声称已核验实时价格、开放时间或交通状态。";
  return evidence.sources.map((source, index) => [
    `[资料${index + 1}｜${source.category}｜${source.official ? "官方或高可信来源" : "公开网页"}]`,
    `标题：${source.title}`,
    `站点：${source.siteName}`,
    `摘要：${source.snippet || "无摘要"}`,
    `网址：${source.url}`,
  ].join("\n")).join("\n\n");
}

async function findAmapPoint(city: string, keyword: string, apiKey: string) {
  const cacheKey = `${city}:${keyword}`;
  const cached = pointCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.location;

  const params = new URLSearchParams({ key: apiKey, keywords: keyword, region: city, city_limit: "true", page_size: "1" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(`${AMAP_PLACE_ENDPOINT}?${params}`, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = await response.json() as { pois?: Array<{ location?: string }> };
    const location = cleanText(payload.pois?.[0]?.location, 80) || null;
    pointCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, location });
    return location;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  return minutes < 60 ? `约 ${minutes} 分钟` : `约 ${Math.floor(minutes / 60)} 小时 ${minutes % 60 || ""} 分钟`.replace("  分钟", "");
}

async function calculateAmapRoute(
  city: string,
  origin: string,
  destination: string,
  transport: TravelRequest["transport"],
  apiKey: string,
): Promise<RouteEstimate | null> {
  const isTransit = transport === "公共交通优先";
  const endpoint = isTransit
    ? "https://restapi.amap.com/v5/direction/transit/integrated"
    : "https://restapi.amap.com/v5/direction/driving";
  const params = new URLSearchParams({ key: apiKey, origin, destination, show_fields: "cost" });
  if (isTransit) {
    params.set("city1", city);
    params.set("city2", city);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(`${endpoint}?${params}`, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = await response.json() as {
      route?: { paths?: Array<{ distance?: string; duration?: string; cost?: string }>; transits?: Array<{ distance?: string; duration?: string; cost?: string }> };
    };
    const candidate = isTransit ? payload.route?.transits?.[0] : payload.route?.paths?.[0];
    if (!candidate) return null;
    const distance = formatDistance(candidate.distance);
    const duration = formatDuration(candidate.duration);
    if (!distance || !duration) return null;
    const numericCost = Number(candidate.cost);
    return {
      mode: isTransit ? "公交" : "驾车",
      distance,
      duration,
      cost: Number.isFinite(numericCost) && numericCost > 0 ? `约 ¥${numericCost}` : undefined,
      source: "高德地图",
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function enrichPlanWithRoutes(plan: TravelPlan, input: TravelRequest) {
  const apiKey = process.env.AMAP_WEB_SERVICE_KEY?.trim();
  if (!apiKey) return { plan, mapConfigured: false, routeCount: 0, warning: "高德路线 API 尚未配置" };

  const maximumLegs = boundedInteger(process.env.AMAP_MAX_ROUTE_LEGS, 12, 24);
  const days = plan.days.map((day) => ({ ...day, stops: day.stops.map((stop) => ({ ...stop })) }));
  let attempted = 0;
  let routeCount = 0;

  for (const day of days) {
    for (let index = 0; index < day.stops.length - 1 && attempted < maximumLegs; index += 1) {
      attempted += 1;
      const current = day.stops[index];
      const next = day.stops[index + 1];
      const [origin, destination] = await Promise.all([
        findAmapPoint(plan.destination, current.title, apiKey),
        findAmapPoint(plan.destination, next.title, apiKey),
      ]);
      if (!origin || !destination) continue;
      const estimate = await calculateAmapRoute(plan.destination, origin, destination, input.transport, apiKey);
      if (!estimate) continue;
      current.routeToNext = estimate;
      routeCount += 1;
    }
  }

  return {
    plan: { ...plan, days },
    mapConfigured: true,
    routeCount,
    warning: routeCount ? undefined : "本次未能匹配到可计算的景点路线",
  };
}
