import type {
  EditorialCityGuide,
  EditorialDay,
  GuideSource,
} from "@/lib/editorial-city-guides";
import type { CitySeason } from "@/lib/cities";

export type CityImageAsset = {
  src: string;
  alt: string;
  role: "cover" | "landmark" | "neighborhood" | "poi" | "food" | "restaurant" | "lifestyle";
  creditId: string;
  subject?: string;
  author?: string;
  sourcePage?: string;
  sourcePlatform?: string;
  license?: string;
  licenseUrl?: string;
  checkedAt?: string;
};

export type CityResearchReference = {
  title: string;
  url: string;
  visibleSummary?: string;
  subject?: string;
  access?: "public-search-index";
  checkedAt: string;
};

export type CityResearchSummary = {
  xiaohongshu: CityResearchReference[];
  official: CityResearchReference[];
};

export type CityExperience = {
  name: string;
  area: string;
  duration: string;
  bestTime: string;
  why: string;
  pitfall: string;
  alternative: string;
};

export type CityPreference =
  | "第一次必去"
  | "地道美食"
  | "标志性餐厅"
  | "少排队"
  | "少折返"
  | "城市漫游"
  | "建筑摄影"
  | "博物馆"
  | "自然风景"
  | "夜生活"
  | "松弛休息"
  | "小众体验";

export type CityRoutePreference = CityPreference | "雨天替代";

export type PreferenceContentItem = {
  id: string;
  title: string;
  summary: string;
  kind: "景点" | "美食" | "餐厅" | "街区" | "体验" | "路线";
  tags: CityPreference[];
};

export type PreferenceRoute = {
  preference: CityRoutePreference;
  title: string;
  summary: string;
  days: number;
  preferenceTags: CityPreference[];
  pace: "轻松" | "正常" | "紧凑";
  areas: string[];
  startTime: string;
  endTime: string;
  transportSummary: string;
  crowdAdvice: string;
  rainAlternative: string;
  removableStops: string[];
  itinerary: EditorialDay[];
};

export type CityFoodDistrict = {
  name: string;
  advice: string;
};

export type CityNeighborhood = {
  name: string;
  why: string;
};

export type CityRouteEdition = {
  title: string;
  days: number;
  label: string;
  summary: string;
  preferenceTags: CityPreference[];
  pace: "轻松" | "正常" | "紧凑";
  areas: string[];
  startTime: string;
  endTime: string;
  transportSummary: string;
  crowdAdvice: string;
  rainAlternative: string;
  removableStops: string[];
  itinerary: EditorialDay[];
};

export type CompleteCityGuide = EditorialCityGuide & {
  region: "华北" | "华东" | "华中" | "华南" | "西南" | "西北" | "东北" | "港澳台";
  aliases: string[];
  recommendedSeasons: CitySeason[];
  idealDays: string;
  dailyBudget: string;
  transit: string;
  travelTags: string[];
  cardImage: string;
  cardImageAlt: string;
  images: CityImageAsset[];
  experiences: CityExperience[];
  foodDistricts: CityFoodDistrict[];
  neighborhoods: CityNeighborhood[];
  rainyPlans: string[];
  nightIdeas: string[];
  arrivalTips: string[];
  firstTimerMistakes: string[];
  routes: CityRouteEdition[];
  preferenceContent: PreferenceContentItem[];
  preferenceRoutes: PreferenceRoute[];
  sources: GuideSource[];
  research?: CityResearchSummary;
};

export type CityGuideSeed = {
  city: string;
  intro: string;
  fit: string;
  stayAdvice: string;
  defaultDays?: 2 | 3 | 4;
  experiences: [CityExperience, CityExperience, CityExperience, CityExperience, CityExperience, CityExperience];
  extraFoods: [string, string, string, string, string];
  museums: [string, string, string];
  natureSpots: [string, string, string];
  restaurants: [
    SeedRestaurant,
    SeedRestaurant,
    SeedRestaurant,
    SeedRestaurant,
  ];
  foodDistricts: [CityFoodDistrict, CityFoodDistrict];
  neighborhoods: [CityNeighborhood, CityNeighborhood, CityNeighborhood];
  rainyPlans: [string, string, string];
  nightIdeas: [string, string];
  arrivalTips: [string, string];
  firstTimerMistakes: [string, string];
  lowPriority: [SeedDecision, SeedDecision];
};

export type SeedRestaurant = {
  name: string;
  identity: string;
  dishes: [string, string];
  area: string;
  meal: string;
  why: string;
  queue: string;
  alternative: string;
};

export type SeedDecision = {
  name: string;
  why: string;
  alternative: string;
};
