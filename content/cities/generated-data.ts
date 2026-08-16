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
  return {
    ...guide,
    image: heroSrc,
    imageAlt: cover?.alt ?? guide.imageAlt,
    cardImage: `/cities/cards/${guide.slug}.webp`,
    cardImageAlt: `${guide.city}${cover?.subject ?? guide.experiences[0]?.name ?? "城市地标"}首页卡片图`,
    images: displayImages,
    sources: guide.sources,
    research,
  };
}
