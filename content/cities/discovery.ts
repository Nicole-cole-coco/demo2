import type { CitySeason } from "@/lib/cities";
import type { CityPreference, CompleteCityGuide } from "./types";

export const CITY_REGIONS = [
  "全部地区",
  "华北",
  "东北",
  "华东",
  "华中",
  "华南",
  "西南",
  "西北",
  "港澳台",
] as const;

export const CITY_SEASONS = ["全年适合", "春季", "夏季", "秋季", "冬季"] as const satisfies readonly CitySeason[];

export const CITY_SORTS = [
  "综合推荐",
  "当前季节推荐",
  "第一次旅行推荐",
  "美食丰富度",
  "少排队优先",
  "松弛度优先",
] as const;

export type CityRegionFilter = (typeof CITY_REGIONS)[number];
export type CitySeasonFilter = (typeof CITY_SEASONS)[number];
export type CitySort = (typeof CITY_SORTS)[number];

export type DiscoveryFilters = {
  query: string;
  preference: CityPreference | "全部";
  region: CityRegionFilter;
  season: CitySeasonFilter;
  sort: CitySort;
};

export type CityDiscoveryMatch = {
  guide: CompleteCityGuide;
  score: number;
  reason: string;
  kind: "城市" | "景点" | "美食" | "餐厅" | "街区" | "旅行问题" | "偏好";
};

export type CityCardPresentation = {
  reason: string;
  routeSummary: {
    title: string;
    days: Array<{ label: string; area: string; sequence: string }>;
    transport: string;
    pace: string;
    suitable: string;
    removable: string;
    crowd: string;
  };
  focusTitle: string;
  focusLines: string[];
};

const RELEASE_SEASON: CitySeason = "夏季";

const PREFERENCE_TERMS: Record<CityPreference, string[]> = {
  第一次必去: ["经典", "地标", "第一次", "古城", "名胜"],
  地道美食: ["美食", "小吃", "早茶", "面", "火锅", "菜", "海鲜", "夜市"],
  标志性餐厅: ["老字号", "传统", "地方经典", "餐厅"],
  少排队: ["小众", "错峰", "支巷", "清晨", "平日", "替代"],
  少折返: ["紧凑", "沿线", "同片区", "街区", "古城", "步行"],
  城市漫游: ["街区", "骑楼", "胡同", "里弄", "老城", "古城", "步行"],
  建筑摄影: ["建筑", "摄影", "园林", "教堂", "城墙", "骑楼", "石窟"],
  博物馆: ["博物馆", "文博", "遗址", "美术馆", "展览"],
  自然风景: ["自然", "山水", "海滨", "湖", "山", "雪", "草原", "峡谷", "湿地"],
  夜生活: ["夜景", "夜市", "夜生活", "酒吧", "夜游", "晚餐"],
  松弛休息: ["慢", "休闲", "松弛", "茶馆", "海滨", "度假", "散步"],
  小众体验: ["小众", "非遗", "支巷", "工业", "市集", "在地", "手作"],
};

const CURATED_BOOSTS: Partial<Record<CityPreference, string[]>> = {
  第一次必去: ["beijing", "shanghai", "hangzhou", "chengdu", "chongqing", "xian", "suzhou", "nanjing", "guangzhou", "qingdao", "xiamen", "guilin", "dali"],
  地道美食: ["chengdu", "chongqing", "guangzhou", "changsha", "xian", "quanzhou", "shantou", "foshan", "wuhan", "xiamen", "yangzhou"],
  标志性餐厅: ["beijing", "shanghai", "hangzhou", "chengdu", "guangzhou", "xian", "nanjing", "suzhou"],
  少排队: ["shaoxing", "quanzhou", "ningbo", "yangzhou", "fuzhou", "jingdezhen", "dandong", "nanning", "kaifeng"],
  少折返: ["suzhou", "quanzhou", "shaoxing", "xiamen", "macau", "kaifeng", "yangzhou", "jingdezhen"],
  城市漫游: ["shanghai", "hangzhou", "suzhou", "quanzhou", "guangzhou", "xiamen", "qingdao", "nanjing", "macau"],
  建筑摄影: ["beijing", "shanghai", "suzhou", "nanjing", "qingdao", "harbin", "quanzhou", "xiamen", "kaifeng"],
  博物馆: ["beijing", "shanghai", "xian", "nanjing", "chengdu", "luoyang", "wuhan", "hangzhou"],
  自然风景: ["guilin", "zhangjiajie", "huangshan", "dali", "lijiang", "lhasa", "sanya", "dalian", "qingdao", "dunhuang", "urumqi"],
  夜生活: ["shanghai", "chengdu", "chongqing", "changsha", "guangzhou", "shenzhen", "hong-kong", "xian"],
  松弛休息: ["hangzhou", "chengdu", "dali", "kunming", "xiamen", "zhuhai", "suzhou", "guiyang", "qingdao"],
  小众体验: ["quanzhou", "shaoxing", "jingdezhen", "dunhuang", "dandong", "nanning", "fuzhou", "ningbo"],
};

const SEAFOOD_CITIES = new Set(["qingdao", "xiamen", "dalian", "sanya", "zhuhai", "fuzhou", "quanzhou", "hong-kong", "kaohsiung"]);
const COOL_SUMMER_CITIES = new Set(["dalian", "harbin", "guiyang", "kunming", "dali", "lhasa", "qingdao", "chengde", "urumqi"]);

function clean(value: string) {
  return value.toLocaleLowerCase("en-US").replace(/[\s，。！？、·—\-_]+/g, "");
}

function guideSections(guide: CompleteCityGuide) {
  return {
    city: [guide.city, guide.province, ...guide.aliases].join(" "),
    sight: guide.experiences.flatMap((item) => [item.name, item.area, item.why]).join(" "),
    food: guide.foods.flatMap((item) => [item.name, item.order, item.note]).join(" "),
    restaurant: guide.restaurants.flatMap((item) => [item.name, item.identity, ...item.order]).join(" "),
    neighborhood: [...guide.neighborhoods.flatMap((item) => [item.name, item.why]), ...guide.foodDistricts.flatMap((item) => [item.name, item.advice])].join(" "),
    general: [guide.intro, guide.fit, ...guide.travelTags, ...guide.themes.flatMap((item) => [item.title, item.advice, item.alternative])].join(" "),
  };
}

function semanticQuery(query: string) {
  const value = clean(query);
  const preferences: CityPreference[] = [];
  if (/第一次|经典|必去/.test(value)) preferences.push("第一次必去");
  if (/美食|吃|火锅|海鲜|餐厅|点菜/.test(value)) preferences.push("地道美食");
  if (/建筑|摄影|拍照/.test(value)) preferences.push("建筑摄影");
  if (/博物馆|展览|文博/.test(value)) preferences.push("博物馆");
  if (/自然|山水|海边|海滨|避暑/.test(value)) preferences.push("自然风景");
  if (/不想太累|不想.{0,5}(走|累)|少走|步行少|轻松|松弛|休息/.test(value)) preferences.push("松弛休息");
  if (/周末|两天|2天|少折返/.test(value)) preferences.push("少折返");
  if (/小众|避开人|少排队/.test(value)) preferences.push("少排队");
  if (/夜生活|夜景|夜游/.test(value)) preferences.push("夜生活");
  const seasons: CitySeason[] = [];
  if (/春天|春季/.test(value)) seasons.push("春季");
  if (/夏天|夏季|避暑/.test(value)) seasons.push("夏季");
  if (/秋天|秋季/.test(value)) seasons.push("秋季");
  if (/冬天|冬季|冰雪/.test(value)) seasons.push("冬季");
  const days = /(?:2|两)天/.test(value) ? 2 : /(?:3|三)天/.test(value) ? 3 : /(?:4|四)天/.test(value) ? 4 : undefined;
  return {
    value,
    preferences: [...new Set(preferences)],
    seasons,
    seafood: /海鲜/.test(value),
    coolSummer: /避暑/.test(value),
    budgetSensitive: /不想太贵|便宜|省钱|控制/.test(value),
    rainy: /下雨|雨天/.test(value),
    days,
    question: /怎么|哪里|哪座|适合|想|不想|第一次|周末|几天|\d天|两天|三天|四天/.test(value),
  };
}

function budgetCeiling(value: string) {
  const amounts = value.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ""))) ?? [];
  return amounts.length ? Math.max(...amounts) : Number.POSITIVE_INFINITY;
}

export function preferenceRelevance(guide: CompleteCityGuide, preference: CityPreference) {
  const corpus = clean([guide.fit, guide.intro, ...guide.travelTags, ...guide.experiences.flatMap((item) => [item.name, item.area, item.why])].join(" "));
  const terms = PREFERENCE_TERMS[preference];
  const hits = terms.filter((term) => corpus.includes(clean(term))).length;
  const curated = CURATED_BOOSTS[preference]?.includes(guide.slug) ? 28 : 0;
  return hits * 9 + curated;
}

export function searchCities(guides: CompleteCityGuide[], query: string): CityDiscoveryMatch[] {
  const intent = semanticQuery(query);
  if (!intent.value) return guides.map((guide, index) => ({ guide, score: guides.length - index, reason: guide.fit, kind: "偏好" }));
  const exactPreferenceQuery = intent.preferences.some((preference) => clean(preference) === intent.value);
  const queryNamesACity = guides.some((guide) => [guide.city, ...guide.aliases].map(clean).filter(Boolean).some((term) => intent.value.includes(term)));

  return guides
    .map((guide) => {
      const sections = guideSections(guide);
      const normalized = Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, clean(value)])) as Record<keyof typeof sections, string>;
      let score = 0;
      let reason = "与你输入的旅行问题相关";
      let kind: CityDiscoveryMatch["kind"] = "旅行问题";

      const cityTerms = [guide.city, ...guide.aliases].map(clean).filter(Boolean);
      const namedCity = cityTerms.some((term) => intent.value.includes(term));
      if (normalized.city.includes(intent.value) || namedCity) {
        score += clean(guide.city) === intent.value ? 180 : namedCity ? 175 : 145;
        reason = `${guide.city}的城市名、拼音或常见别名与搜索一致`;
        kind = "城市";
      }

      const directSections: Array<[keyof typeof sections, CityDiscoveryMatch["kind"]]> = [
        ["sight", "景点"], ["food", "美食"], ["restaurant", "餐厅"], ["neighborhood", "街区"], ["general", "旅行问题"],
      ];
      for (const [section, sectionKind] of directSections) {
        if (normalized[section].includes(intent.value)) {
          score += section === "general" ? 38 : 70;
          if (kind !== "城市") {
            kind = sectionKind;
            reason = `${sectionKind}内容与“${query.trim()}”直接相关`;
          }
        }
      }

      for (const preference of intent.preferences) score += preferenceRelevance(guide, preference);
      if (intent.seasons.some((season) => guide.recommendedSeasons.includes(season) || guide.recommendedSeasons.includes("全年适合"))) score += 24;
      if (intent.seafood && SEAFOOD_CITIES.has(guide.slug)) {
        score += 64;
        reason = `${guide.city}有成熟的海鲜饮食与相关街区`;
        kind = "美食";
      }
      if (intent.coolSummer && COOL_SUMMER_CITIES.has(guide.slug)) {
        score += 72;
        reason = `${guide.city}适合纳入夏季避暑候选`;
        kind = "旅行问题";
      }
      if (intent.budgetSensitive) score += Math.max(0, 20 - budgetCeiling(guide.dailyBudget) / 80);
      if (intent.days) {
        const idealDays = guide.idealDays.match(/\d+/g)?.map(Number) ?? [];
        if (!idealDays.length || (intent.days >= Math.min(...idealDays) && intent.days <= Math.max(...idealDays))) score += 24;
      }
      if (intent.rainy && guide.rainyPlans.length >= 3) {
        score += 18;
        if (namedCity || normalized.city.includes(intent.value)) reason = `${guide.city}已有可执行的雨天替代路线`;
      }

      return { guide, score, reason, kind };
    })
    .filter((item) => item.score >= (queryNamesACity ? 90 : intent.question ? intent.coolSummer ? 60 : 18 : exactPreferenceQuery ? 45 : 70))
    .sort((a, b) => b.score - a.score || a.guide.city.localeCompare(b.guide.city, "zh-CN"));
}

function sortScore(guide: CompleteCityGuide, sort: CitySort, preference: DiscoveryFilters["preference"]) {
  switch (sort) {
    case "当前季节推荐": return guide.recommendedSeasons.includes(RELEASE_SEASON) || guide.recommendedSeasons.includes("全年适合") ? 100 : 0;
    case "第一次旅行推荐": return preferenceRelevance(guide, "第一次必去");
    case "美食丰富度": return preferenceRelevance(guide, "地道美食") + guide.foods.length;
    case "少排队优先": return preferenceRelevance(guide, "少排队");
    case "松弛度优先": return preferenceRelevance(guide, "松弛休息");
    default: return preference === "全部" ? 0 : preferenceRelevance(guide, preference);
  }
}

export function discoverCities(guides: CompleteCityGuide[], filters: DiscoveryFilters): CityDiscoveryMatch[] {
  const searched = filters.query.trim()
    ? searchCities(guides, filters.query)
    : guides.map((guide, index) => ({ guide, score: guides.length - index, reason: guide.fit, kind: "偏好" as const }));
  const bySlug = new Map(searched.map((item) => [item.guide.slug, item]));
  return guides
    .filter((guide) => bySlug.has(guide.slug))
    .filter((guide) => filters.region === "全部地区" || guide.region === filters.region)
    .filter((guide) => filters.season === "全年适合" || guide.recommendedSeasons.includes(filters.season) || guide.recommendedSeasons.includes("全年适合"))
    .filter((guide) => filters.preference === "全部" || preferenceRelevance(guide, filters.preference) >= 18)
    .map((guide, index) => {
      const match = bySlug.get(guide.slug)!;
      return { ...match, score: match.score + sortScore(guide, filters.sort, filters.preference) - index / 1000 };
    })
    .sort((a, b) => b.score - a.score || a.guide.city.localeCompare(b.guide.city, "zh-CN"));
}

export function nearestCities(guides: CompleteCityGuide[], filters: DiscoveryFilters, count = 3) {
  const relaxed: DiscoveryFilters = { ...filters, region: "全部地区", season: "全年适合" };
  const matches = discoverCities(guides, relaxed);
  const fallback = matches.length ? matches : searchCities(guides, filters.query);
  return fallback.slice(0, count);
}

export function cityCardPresentation(guide: CompleteCityGuide, preference: DiscoveryFilters["preference"], queryMatch?: CityDiscoveryMatch): CityCardPresentation {
  const route = preference === "全部" ? undefined : guide.preferenceRoutes.find((item) => item.preference === preference);
  const defaultRoute = guide.routes.find((item) => item.days === 3) ?? guide.routes[0];
  const content = preference === "全部" ? [] : guide.preferenceContent.filter((item) => item.tags.includes(preference)).slice(0, 3);
  const reason = queryMatch?.reason ?? (route ? `${route.preference}会改变每天的地点顺序、餐厅和删减项；优先覆盖${route.areas.slice(0, 3).join("、")}。` : guide.fit);
  const routeForCard = route ?? defaultRoute;
  const cardRoute = {
    title: route ? `${guide.city} · ${preference}路线` : defaultRoute.title,
    days: routeForCard.itinerary.slice(0, 3).map((day, index) => ({
      label: `D${index + 1}`,
      area: day.area,
      sequence: day.nodes.slice(0, 5).map((node) => node.title).join(" → "),
    })),
    transport: routeForCard.transportSummary,
    pace: routeForCard.pace,
    suitable: preference === "全部" ? "第一次到访、希望按片区少折返" : preference,
    removable: routeForCard.removableStops[0] ?? routeForCard.itinerary[0]?.remove ?? "取消当天最后一个可选节点",
    crowd: routeForCard.crowdAdvice,
  };
  if (preference === "少排队" && route) {
    const alternative = route.itinerary.flatMap((day) => day.nodes).find((item) => item.alternative)?.alternative ?? guide.experiences[0].alternative;
    return { reason, routeSummary: cardRoute, focusTitle: "避开人潮", focusLines: [`推荐时段：${route.startTime}开始`, `替代选择：${alternative}`] };
  }
  if (preference === "地道美食" || preference === "标志性餐厅") {
    return { reason, routeSummary: cardRoute, focusTitle: "怎么吃", focusLines: [`代表菜：${guide.foods.slice(0, 3).map((item) => item.name).join("、")}`, `餐厅：${guide.restaurants.slice(0, 2).map((item) => item.name).join("、")}`, `片区：${guide.foodDistricts[0]?.name ?? guide.restaurants[0]?.area}`] };
  }
  if (preference === "少折返" && route) {
    return { reason, routeSummary: cardRoute, focusTitle: "片区化走法", focusLines: [`集中片区：${route.itinerary[0]?.area}`, `建议停留：${guide.idealDays}`, `当天范围：${route.itinerary[0]?.nodes.slice(0, 3).map((item) => item.title).join("—")}`] };
  }
  return {
    reason,
    routeSummary: cardRoute,
    focusTitle: preference === "全部" ? "这座城市的重点" : preference,
    focusLines: content.length ? content.map((item) => item.title) : guide.travelTags.slice(0, 3),
  };
}

export function comparisonLevel(guide: CompleteCityGuide, preference: CityPreference) {
  const score = preferenceRelevance(guide, preference);
  if (score >= 45) return "很适合";
  if (score >= 27) return "比较适合";
  if (score >= 12) return "一般";
  return "不突出";
}

export function isRegionFilter(value: string): value is CityRegionFilter {
  return CITY_REGIONS.includes(value as CityRegionFilter);
}

export function isSeasonFilter(value: string): value is CitySeasonFilter {
  return CITY_SEASONS.includes(value as CitySeasonFilter);
}

export function isCitySort(value: string): value is CitySort {
  return CITY_SORTS.includes(value as CitySort);
}
