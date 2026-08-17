import { EAST_A_SEEDS } from "./east-a";
import { EAST_B_SEEDS } from "./east-b";
import { EXPANSION_SEEDS } from "./expansion";
import { FEATURED_GUIDES } from "./featured";
import { NORTH_NORTHEAST_SEEDS } from "./north-northeast";
import { NORTHWEST_HMT_SEEDS } from "./northwest-hmt";
import { SOUTHWEST_SEEDS } from "./southwest";
import { CENTRAL_SOUTH_SEEDS } from "./central-south";
import { createCompleteCityGuide } from "./factory";
import { enrichGuideWithGeneratedData } from "./generated-data";
import type { CompleteCityGuide } from "./types";

export type { CompleteCityGuide, CityPreference, PreferenceContentItem } from "./types";
export { TRAVEL_INTERESTS } from "@/lib/editorial-city-guides";
export {
  CITY_REGIONS,
  CITY_SEASONS,
  CITY_SORTS,
  cityCardPresentation,
  comparisonLevel,
  discoverCities,
  isCitySort,
  isRegionFilter,
  isSeasonFilter,
  nearestCities,
  preferenceRelevance,
  searchCities,
} from "./discovery";
export type { CityDiscoveryMatch, CityRegionFilter, CitySeasonFilter, CitySort, DiscoveryFilters } from "./discovery";

const generatedGuides = [
  ...NORTH_NORTHEAST_SEEDS,
  ...EAST_A_SEEDS,
  ...EAST_B_SEEDS,
  ...CENTRAL_SOUTH_SEEDS,
  ...SOUTHWEST_SEEDS,
  ...NORTHWEST_HMT_SEEDS,
  ...EXPANSION_SEEDS,
].map(createCompleteCityGuide);

const allGuides = [...FEATURED_GUIDES, ...generatedGuides].map(enrichGuideWithGeneratedData);

export type GuideValidation = {
  city: string;
  slug: string;
  valid: boolean;
  errors: string[];
};

export function validateCompleteCityGuide(guide: CompleteCityGuide): GuideValidation {
  const errors: string[] = [];
  if (!guide.slug || !guide.image) errors.push("缺少独立 URL 或首图");
  if (!guide.cardImage || !guide.cardImageAlt) errors.push("缺少首页城市卡片图");
  if (guide.experiences.length < 8) errors.push("代表体验少于 8 项");
  if (guide.foods.length < 8) errors.push("代表美食少于 8 项");
  if (guide.restaurants.length < 4) errors.push("标志性餐厅少于 4 家");
  if (![2, 3, 4].every((days) => guide.routes.some((route) => route.days === days && route.itinerary.length === days))) errors.push("缺少独立 2/3/4 日路线");
  for (const route of guide.routes) {
    if (!route.title || !route.transportSummary || !route.crowdAdvice || !route.rainAlternative || !route.areas.length) errors.push(`${route.days}日路线缺少结构化摘要`);
    if (route.itinerary.some((day) => !day.startTime || !day.endTime || !day.transportSummary || !day.rainAlternative || !day.queueAlternative || day.nodes.some((node) => !node.duration || !node.transportMode || !node.transportTime || !node.booking || !node.crowd))) errors.push(`${route.days}日路线节点字段不完整`);
  }
  if (guide.rainyPlans.length < 3) errors.push("雨天方案少于 3 项");
  if (guide.nightIdeas.length < 2) errors.push("夜间体验少于 2 项");
  for (const route of guide.preferenceRoutes) {
    const contentPreference = route.preference === "雨天替代" ? "博物馆" : route.preference;
    if (guide.preferenceContent.filter((item) => item.tags.includes(contentPreference)).length < 3) errors.push(`${route.preference}内容少于 3 项`);
    if (route.itinerary.length < 4 || route.itinerary.some((day) => day.nodes.length < 4)) errors.push(`${route.preference}缺少可执行路线`);
    if (!route.transportSummary || !route.crowdAdvice || !route.rainAlternative || route.itinerary.some((day) => !day.startTime || !day.endTime || !day.queueAlternative || !day.rainAlternative)) errors.push(`${route.preference}路线缺少取舍与异常方案`);
  }
  if (!guide.preferenceRoutes.some((route) => route.preference === "雨天替代")) errors.push("缺少雨天替代路线");
  const serialized = JSON.stringify(guide);
  if (/待完善|即将上线|lorem ipsum/i.test(serialized)) errors.push("含占位内容");
  if (guide.city !== "杭州" && /灵隐飞来峰|北山街—白堤|楼外楼（孤山路）/.test(serialized)) errors.push("出现杭州内容串场");
  return { city: guide.city, slug: guide.slug, valid: errors.length === 0, errors };
}

const slugs = new Set<string>();
const cities = new Set<string>();
for (const guide of allGuides) {
  if (slugs.has(guide.slug) || cities.has(guide.city)) throw new Error(`城市 slug 或名称重复：${guide.city}/${guide.slug}`);
  slugs.add(guide.slug);
  cities.add(guide.city);
}

export const CITY_GUIDE_VALIDATION = allGuides.map(validateCompleteCityGuide);
const invalid = CITY_GUIDE_VALIDATION.filter((item) => !item.valid);
if (invalid.length) {
  throw new Error(`城市内容完整性检查失败：${invalid.map((item) => `${item.city}[${item.errors.join("、")}]`).join("；")}`);
}

export const PUBLISHED_CITY_GUIDES: CompleteCityGuide[] = allGuides;

export function getCompleteCityGuide(slug: string) {
  return PUBLISHED_CITY_GUIDES.find((guide) => guide.slug === slug);
}

export function getGuideSource(guide: CompleteCityGuide, sourceId?: string) {
  if (!sourceId) return undefined;
  return guide.sources.find((source) => source.id === sourceId);
}
