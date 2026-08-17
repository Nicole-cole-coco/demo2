import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PUBLISHED_CITY_GUIDES, TRAVEL_INTERESTS } from "../content/cities/index.ts";

type ImageCheck = {
  src: string;
  role: string;
  subject?: string;
  alt: string | null;
  sourcePage: string | null;
  license: string | null;
  exists: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  hash?: string;
  error?: string;
  placeholder: boolean;
  usable: boolean;
  metadataIssues: string[];
  technicalIssues: string[];
  upstreamSrc?: string | null;
  upstreamSourcePage?: string | null;
  upstreamLicense?: string | null;
  upstreamTraceable?: boolean;
};

type ImageInput = {
  src: string;
  alt?: string;
  role: string;
  subject?: string;
  sourcePage?: string;
  license?: string;
  upstream?: {
    src?: string;
    sourcePage?: string;
    license?: string;
  };
};

function hasText(value?: string): value is string {
  return Boolean(value?.trim());
}

function isPlaceholderSource(value?: string | null) {
  return Boolean(value && (/^internal:\/\/city-placeholder/i.test(value) || /^derived-from-cover$/i.test(value)));
}

function hasTraceableSource(image?: Pick<ImageInput, "sourcePage" | "license">) {
  return Boolean(image && hasText(image.sourcePage) && !isPlaceholderSource(image.sourcePage) && hasText(image.license));
}

const publicRoot = path.resolve("public");
const reports: Array<Record<string, unknown> & { city: string; slug: string; checkedImages: ImageCheck[]; missing: string[] }> = [];
const hashOwners = new Map<string, Array<{ city: string; src: string }>>();

for (const guide of PUBLISHED_CITY_GUIDES) {
  const coverImage = guide.images.find((image) => image.role === "cover");
  const checkedImages: ImageCheck[] = [];
  const imagesToCheck: ImageInput[] = [
    ...guide.images,
    {
      src: guide.cardImage,
      alt: guide.cardImageAlt,
      role: "card",
      subject: guide.city,
      sourcePage: coverImage?.sourcePage,
      license: coverImage?.license,
      upstream: {
        src: coverImage?.src,
        sourcePage: coverImage?.sourcePage,
        license: coverImage?.license,
      },
    },
  ].filter((image, index, values) => values.findIndex((candidate) => candidate.src === image.src) === index);

  for (const image of imagesToCheck) {
    const metadataIssues: string[] = [];
    const technicalIssues: string[] = [];
    const upstreamTraceable = image.role === "card" ? hasTraceableSource(image.upstream) : undefined;
    const pathLooksLikePlaceholder = /detail-[12]\.jpg$|placeholder/i.test(image.src);
    const placeholder = pathLooksLikePlaceholder || isPlaceholderSource(image.sourcePage) || !hasTraceableSource(image) || upstreamTraceable === false;
    const check: ImageCheck = {
      src: image.src,
      role: image.role,
      subject: image.subject,
      alt: image.alt?.trim() || null,
      sourcePage: image.sourcePage?.trim() || null,
      license: image.license?.trim() || null,
      exists: false,
      placeholder,
      usable: false,
      metadataIssues,
      technicalIssues,
      ...(image.role === "card" ? {
        upstreamSrc: image.upstream?.src ?? null,
        upstreamSourcePage: image.upstream?.sourcePage?.trim() || null,
        upstreamLicense: image.upstream?.license?.trim() || null,
        upstreamTraceable,
      } : {}),
    };

    if (!check.alt) metadataIssues.push("缺少 alt");
    if (!check.sourcePage) metadataIssues.push("缺少 sourcePage");
    else if (isPlaceholderSource(check.sourcePage)) metadataIssues.push("sourcePage 指向占位或派生标记");
    if (!check.license) metadataIssues.push("缺少 license");
    if (pathLooksLikePlaceholder) metadataIssues.push("文件名表明仍是占位图");
    if (image.role === "card" && !upstreamTraceable) metadataIssues.push("首页卡片缺少可追溯的授权首图上游");

    try {
      const absolutePath = path.join(publicRoot, image.src.replace(/^\//, ""));
      await access(absolutePath);
      check.exists = true;
      const [metadata, file, buffer] = await Promise.all([sharp(absolutePath).metadata(), stat(absolutePath), readFile(absolutePath)]);
      check.width = metadata.width;
      check.height = metadata.height;
      check.bytes = file.size;
      check.hash = createHash("sha256").update(buffer).digest("hex");
      const owners = hashOwners.get(check.hash) ?? [];
      owners.push({ city: guide.city, src: image.src });
      hashOwners.set(check.hash, owners);
      if (!metadata.width || !metadata.height) technicalIssues.push("缺少宽高");
      else if (metadata.width < 700 || metadata.height < 450) technicalIssues.push("分辨率不足");
      else if (image.role === "cover" && metadata.width / metadata.height < 1.55) technicalIssues.push("首图比例不足 16:9");
      else if (image.role === "card" && Math.abs(metadata.width / metadata.height - 1.5) > 0.08) technicalIssues.push("首页卡片图不是 3:2");
      else if (!["cover", "card"].includes(image.role) && Math.abs(metadata.width / metadata.height - 4 / 3) > 0.09) technicalIssues.push("内容图不是 4:3");
      if (file.size > 900_000) technicalIssues.push("文件超过 900KB");
    } catch (error) {
      technicalIssues.push(error instanceof Error ? `文件不存在或无法读取：${error.message}` : "文件不存在或无法读取");
    }
    check.usable = metadataIssues.length === 0 && technicalIssues.length === 0 && !placeholder;
    if (!check.usable) check.error = [...metadataIssues, ...technicalIssues].join("；") || "图片检查未通过";
    checkedImages.push(check);
  }

  const usableGuideImages = checkedImages.filter((image) => image.role !== "card" && image.usable);
  const categoryCount = (role: string) => checkedImages.filter((image) => image.role === role && image.usable).length;
  const pitfalls = new Set([...guide.firstTimerMistakes, ...guide.experiences.map((item) => item.pitfall), ...guide.decisions.filter((item) => item.verdict !== "值得去").map((item) => item.why)]);
  const preferenceCoverage = TRAVEL_INTERESTS.filter((preference) => guide.preferenceContent.some((item) => item.tags.includes(preference))).length;
  const routePreferenceCoverage = new Set(guide.preferenceRoutes.map((route) => route.preference));
  const nodeCount = [...guide.routes, ...guide.preferenceRoutes].reduce((sum, route) => sum + route.itinerary.reduce((daySum, day) => daySum + day.nodes.length, 0), 0);
  const invalidRouteDays = [...guide.routes, ...guide.preferenceRoutes].flatMap((route) => route.itinerary).filter((day) => !day.startTime || !day.endTime || !day.transportSummary || !day.queueAlternative || !day.rainAlternative || !day.lateStartAdjustment || day.nodes.some((node) => !node.duration || !node.transportMode || !node.transportTime || !node.booking || !node.crowd));
  const missing: string[] = [];
  if (categoryCount("cover") < 1) missing.push("可追溯城市首图");
  if (categoryCount("card") < 1) missing.push("首页3:2城市卡片图");
  if (categoryCount("poi") < 6) missing.push(`景点图片 ${categoryCount("poi")}/6`);
  if (categoryCount("food") < 6) missing.push(`美食图片 ${categoryCount("food")}/6`);
  if (categoryCount("restaurant") < 4) missing.push(`餐厅或代表菜图片 ${categoryCount("restaurant")}/4`);
  if (categoryCount("lifestyle") < 3) missing.push(`街区与生活图片 ${categoryCount("lifestyle")}/3`);
  if (guide.experiences.length < 8) missing.push(`代表体验 ${guide.experiences.length}/8`);
  if (guide.foods.length < 8) missing.push(`美食 ${guide.foods.length}/8`);
  if (guide.restaurants.length < 4) missing.push(`餐厅 ${guide.restaurants.length}/4`);
  if (guide.neighborhoods.length < 3) missing.push(`街区 ${guide.neighborhoods.length}/3`);
  if (guide.rainyPlans.length < 2) missing.push(`雨天方案 ${guide.rainyPlans.length}/2`);
  if (guide.nightIdeas.length < 2) missing.push(`夜间活动 ${guide.nightIdeas.length}/2`);
  if (pitfalls.size < 5) missing.push(`具体避坑 ${pitfalls.size}/5`);
  if (![2, 3, 4].every((days) => guide.routes.some((route) => route.days === days && route.itinerary.length === days))) missing.push("2/3/4 日结构化路线");
  if (invalidRouteDays.length) missing.push(`路线字段不完整 ${invalidRouteDays.length} 天`);
  if (routePreferenceCoverage.size < TRAVEL_INTERESTS.length + 1) missing.push(`偏好及雨天路线 ${routePreferenceCoverage.size}/${TRAVEL_INTERESTS.length + 1}`);
  if (preferenceCoverage < TRAVEL_INTERESTS.length) missing.push(`偏好内容 ${preferenceCoverage}/${TRAVEL_INTERESTS.length}`);
  if ((guide.research?.xiaohongshu.length ?? 0) < 5) missing.push(`小红书公开攻略 ${guide.research?.xiaohongshu.length ?? 0}/5`);
  const verifiedOfficialSources = guide.sources.filter((source) => source.official).length;
  if (verifiedOfficialSources < 2) missing.push(`已人工确认的官方资料 ${verifiedOfficialSources}/2`);
  const technicalImageFailures = checkedImages.filter((image) => image.technicalIssues.length);
  const metadataImageFailures = checkedImages.filter((image) => image.metadataIssues.length);
  const imageAuditFailures = checkedImages.filter((image) => !image.usable);
  const missingFiles = checkedImages.filter((image) => !image.exists);
  const missingAlt = checkedImages.filter((image) => !image.alt);
  const missingSourcePage = checkedImages.filter((image) => !image.sourcePage || isPlaceholderSource(image.sourcePage));
  const missingLicense = checkedImages.filter((image) => !image.license);
  const invalidDimensions = checkedImages.filter((image) => image.technicalIssues.some((issue) => /宽高|分辨率|比例|不是 3:2|不是 4:3/.test(issue)));
  const oversizedImages = checkedImages.filter((image) => image.technicalIssues.some((issue) => issue.includes("900KB")));
  const cardsWithoutTraceableUpstream = checkedImages.filter((image) => image.role === "card" && image.upstreamTraceable === false);
  if (missingFiles.length) missing.push(`图片文件不存在或无法读取 ${missingFiles.length}`);
  if (invalidDimensions.length) missing.push(`图片尺寸或比例不合格 ${invalidDimensions.length}`);
  if (oversizedImages.length) missing.push(`图片文件超过 900KB ${oversizedImages.length}`);
  if (missingAlt.length) missing.push(`图片缺少 alt ${missingAlt.length}`);
  if (missingSourcePage.length) missing.push(`图片缺少有效 sourcePage ${missingSourcePage.length}`);
  if (missingLicense.length) missing.push(`图片缺少 license ${missingLicense.length}`);
  if (cardsWithoutTraceableUpstream.length) missing.push(`首页卡片缺少可追溯授权首图上游 ${cardsWithoutTraceableUpstream.length}`);
  const visiblePlaceholders = checkedImages.filter((image) => image.placeholder && image.role !== "card");
  if (visiblePlaceholders.length) missing.push(`未获授权或占位图片 ${visiblePlaceholders.length}`);

  reports.push({
    city: guide.city,
    slug: guide.slug,
    images: usableGuideImages.length,
    imageFailures: technicalImageFailures.length,
    imageAuditFailures: imageAuditFailures.length,
    imageMetadataFailures: metadataImageFailures.length,
    missingImageFiles: missingFiles.length,
    missingImageAlt: missingAlt.length,
    missingImageSourcePage: missingSourcePage.length,
    missingImageLicense: missingLicense.length,
    invalidImageDimensions: invalidDimensions.length,
    oversizedImages: oversizedImages.length,
    cardsWithoutTraceableUpstream: cardsWithoutTraceableUpstream.length,
    placeholderImages: visiblePlaceholders.length,
    imageCategories: { cover: categoryCount("cover"), card: categoryCount("card"), poi: categoryCount("poi"), food: categoryCount("food"), restaurant: categoryCount("restaurant"), lifestyle: categoryCount("lifestyle") },
    experiences: guide.experiences.length,
    foods: guide.foods.length,
    restaurants: guide.restaurants.length,
    neighborhoods: guide.neighborhoods.length,
    rainyPlans: guide.rainyPlans.length,
    nightIdeas: guide.nightIdeas.length,
    pitfalls: pitfalls.size,
    routes: guide.routes.map((route) => route.days),
    routePreferences: routePreferenceCoverage.size,
    routeNodes: nodeCount,
    invalidRouteDays: invalidRouteDays.length,
    xiaohongshuReferences: guide.research?.xiaohongshu.length ?? 0,
    officialSources: verifiedOfficialSources,
    preferenceCoverage: `${preferenceCoverage}/${TRAVEL_INTERESTS.length}`,
    checkedImages,
    missing,
  });
}

const duplicates = [...hashOwners.entries()]
  .filter(([, owners]) => new Set(owners.map((owner) => owner.city)).size > 1)
  .map(([hash, owners]) => ({ hash, owners }));
for (const report of reports) {
  const cityDuplicates = duplicates.filter((duplicate) => duplicate.owners.some((owner) => owner.city === report.city));
  if (cityDuplicates.length) report.missing.push(`跨城市重复图片 ${cityDuplicates.length}`);
  report.duplicateImages = cityDuplicates;
  report.complete = report.missing.length === 0;
}

const summary = {
  generatedAt: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
  cityCount: reports.length,
  completeCities: reports.filter((city) => city.complete).length,
  licensedImages: reports.reduce((sum, city) => sum + Number(city.images), 0),
  imageFailures: reports.reduce((sum, city) => sum + Number(city.imageFailures), 0),
  imageAuditFailures: reports.reduce((sum, city) => sum + Number(city.imageAuditFailures), 0),
  imageMetadataFailures: reports.reduce((sum, city) => sum + Number(city.imageMetadataFailures), 0),
  missingImageFiles: reports.reduce((sum, city) => sum + Number(city.missingImageFiles), 0),
  missingImageAlt: reports.reduce((sum, city) => sum + Number(city.missingImageAlt), 0),
  missingImageSourcePage: reports.reduce((sum, city) => sum + Number(city.missingImageSourcePage), 0),
  missingImageLicense: reports.reduce((sum, city) => sum + Number(city.missingImageLicense), 0),
  invalidImageDimensions: reports.reduce((sum, city) => sum + Number(city.invalidImageDimensions), 0),
  oversizedImages: reports.reduce((sum, city) => sum + Number(city.oversizedImages), 0),
  cardsWithoutTraceableUpstream: reports.reduce((sum, city) => sum + Number(city.cardsWithoutTraceableUpstream), 0),
  placeholders: reports.reduce((sum, city) => sum + Number(city.placeholderImages), 0),
  crossCityDuplicateGroups: duplicates.length,
  structuredRouteEditions: reports.reduce((sum, city) => sum + (city.routes as number[]).length + Number(city.routePreferences), 0),
};

await mkdir("docs", { recursive: true });
await writeFile("docs/content-completeness-report.json", `${JSON.stringify({ summary, cities: reports }, null, 2)}\n`, "utf8");
const markdown = [
  "# 城市内容完整度检查",
  "",
  `检查日期：${summary.generatedAt}`,
  "",
  `- 公开城市：${summary.cityCount}`,
  `- 达到全部标准：${summary.completeCities}`,
  `- 来源、alt、文件与规格均合格的本地内容图片：${summary.licensedImages}`,
  `- 图片检查不合格（含派生卡片）：${summary.imageAuditFailures}`,
  `- 图片技术失败：${summary.imageFailures}`,
  `- 图片来源或 alt 不完整：${summary.imageMetadataFailures}`,
  `- 缺少有效 sourcePage：${summary.missingImageSourcePage}`,
  `- 缺少 license：${summary.missingImageLicense}`,
  `- 缺少 alt：${summary.missingImageAlt}`,
  `- 文件不存在或无法读取：${summary.missingImageFiles}`,
  `- 尺寸或比例不合格：${summary.invalidImageDimensions}`,
  `- 文件超过 900KB：${summary.oversizedImages}`,
  `- 首页卡片缺少可追溯授权首图上游：${summary.cardsWithoutTraceableUpstream}`,
  `- 仍在数据中的占位或未授权图：${summary.placeholders}`,
  `- 跨城市重复图片组：${summary.crossCityDuplicateGroups}`,
  `- 结构化路线版本：${summary.structuredRouteEditions}`,
  "",
  "| 城市 | 可追溯图 | 首图/卡片/景点/美食/餐厅/生活 | 路线版本 | 路线节点 | 小红书参考 | 官方来源 | 状态 |",
  "| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |",
  ...reports.map((city) => {
    const categories = city.imageCategories as Record<string, number>;
    return `| ${city.city} | ${city.images} | ${categories.cover}/${categories.card}/${categories.poi}/${categories.food}/${categories.restaurant}/${categories.lifestyle} | ${3 + Number(city.routePreferences)} | ${city.routeNodes} | ${city.xiaohongshuReferences} | ${city.officialSources} | ${city.complete ? "完整" : city.missing.join("；")} |`;
  }),
  "",
  "> 只有图片、路线、游客经验和官方来源全部达标的城市才会标记为“完整”。",
  "",
].join("\n");
await writeFile("docs/content-completeness-report.md", markdown, "utf8");
console.log(JSON.stringify(summary));
