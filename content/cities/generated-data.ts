import mediaManifest from "./media-manifest.json";
import researchManifest from "./research-manifest.json";
import coverAttribution from "../../public/cities/attribution.json";
import type { CityImageAsset, CityResearchReference, CityResearchSummary, CompleteCityGuide } from "./types";

type MediaEntry = {
  status: string;
  category: "cover" | "poi" | "food" | "restaurant" | "lifestyle";
  subject: string;
  localPath?: string;
  alt: string;
  author?: string;
  sourcePage?: string;
  sourcePlatform?: string;
  license?: string;
  licenseUrl?: string;
  retrievedAt?: string;
};

type ResearchEntry = {
  title: string;
  url: string;
  visibleSummary?: string;
  subject?: string;
  access?: "public-search-index";
  checkedAt: string;
};

type MediaManifest = { cities: Record<string, { city: string; assets: MediaEntry[] }> };
type ResearchManifest = { cities: Record<string, { city: string; xiaohongshu: ResearchEntry[]; official: ResearchEntry[] }> };
type CoverAttribution = { items: Array<{ local_path: string; author: string; source_page: string; license: string; license_url: string; retrieved_at: string }> };

function researchReference(entry: ResearchEntry): CityResearchReference {
  return {
    title: entry.title,
    url: entry.url,
    visibleSummary: entry.visibleSummary,
    subject: entry.subject,
    access: entry.access,
    checkedAt: entry.checkedAt,
  };
}

function ensureEightExperiences(guide: CompleteCityGuide) {
  const existing = new Set(guide.experiences.map((item) => item.name));
  const additions = guide.preferenceContent
    .filter((item) => item.kind === "体验" && !existing.has(item.title) && !item.title.startsWith("雨天替代"))
    .map((item, index) => ({
      name: item.title,
      area: `${item.title}周边`,
      duration: /博物馆|美术馆|纪念馆|展览|馆$/.test(item.title) ? "2—3小时" : "建议预留半天",
      bestTime: /博物馆|美术馆|纪念馆|展览|馆$/.test(item.title) ? "开馆后的首个可用时段" : "天气稳定的上午或傍晚",
      why: item.summary,
      pitfall: /博物馆|美术馆|纪念馆|展览|馆$/.test(item.title)
        ? "闭馆日、预约和入馆要求可能变化，出发前查看场馆官方公告。"
        : "天气、交通和季节会改变体验，不在信息不足时承诺实时客流或精确耗时。",
      alternative: guide.rainyPlans[index % guide.rainyPlans.length] ?? "天气或开放安排不合适时，改走同片区室内项目。",
    }));

  return [...guide.experiences, ...additions].slice(0, 8);
}

export function enrichGuideWithGeneratedData(guide: CompleteCityGuide): CompleteCityGuide {
  const media = (mediaManifest as MediaManifest).cities[guide.slug]?.assets ?? [];
  const licensed = media.filter((item) => item.status === "licensed" && item.localPath);
  const generatedImages: CityImageAsset[] = licensed.map((item, index) => ({
    src: item.localPath!,
    alt: item.alt,
    role: item.category,
    creditId: `${guide.slug}-generated-media-${index + 1}`,
    subject: item.subject,
    author: item.author,
    sourcePage: item.sourcePage,
    sourcePlatform: item.sourcePlatform,
    license: item.license,
    licenseUrl: item.licenseUrl,
    checkedAt: item.retrievedAt,
  }));
  const cover = generatedImages.find((item) => item.role === "cover");
  const attributedCover = (coverAttribution as CoverAttribution).items.find((item) => item.local_path === guide.image);
  const fallbackImages = guide.images.map((image) => image.role === "cover" && attributedCover ? {
    ...image,
    author: attributedCover.author,
    sourcePage: attributedCover.source_page,
    sourcePlatform: "Wikimedia Commons / Unsplash",
    license: attributedCover.license,
    licenseUrl: attributedCover.license_url,
    checkedAt: attributedCover.retrieved_at,
  } : image);
  const mergedImages = generatedImages.length
    ? [...(cover ? [] : fallbackImages.filter((image) => image.role === "cover")), ...generatedImages, ...fallbackImages.filter((image) => (image.role === "landmark" || image.role === "neighborhood") && image.sourcePage)]
    : fallbackImages.filter((image) => image.role === "cover");
  const heroSrc = `/cities/heroes/${guide.slug}.webp`;
  const displayImages = mergedImages.map((image) => image.role === "cover" ? { ...image, src: heroSrc } : image);
  const researchEntry = (researchManifest as ResearchManifest).cities[guide.slug];
  const research: CityResearchSummary = {
    xiaohongshu: (researchEntry?.xiaohongshu ?? []).map(researchReference),
    official: (researchEntry?.official ?? []).map(researchReference),
  };
  const experiences = ensureEightExperiences(guide);
  return {
    ...guide,
    image: heroSrc,
    imageAlt: cover?.alt ?? guide.imageAlt,
    cardImage: `/cities/cards/${guide.slug}.webp`,
    cardImageAlt: `${guide.city}${cover?.subject ?? guide.experiences[0]?.name ?? "城市地标"}首页卡片图`,
    images: displayImages,
    experiences,
    sources: guide.sources,
    research,
  };
}
