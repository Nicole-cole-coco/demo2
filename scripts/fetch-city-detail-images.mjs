import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const targets = JSON.parse((await readFile(path.join(root, "docs/city-media-targets.json"), "utf8")).replace(/^\uFEFF/, ""));
const manifestPath = path.join(root, "content/cities/media-manifest.json");
const manifest = JSON.parse((await readFile(manifestPath, "utf8")).replace(/^\uFEFF/, ""));
const attribution = JSON.parse((await readFile(path.join(root, "public/cities/attribution.json"), "utf8")).replace(/^\uFEFF/, ""));
const outputRoot = path.join(root, "public/cities/media");
const used = new Set([
  ...(attribution.items ?? []).map((item) => item.original_url),
  ...Object.values(manifest.cities ?? {}).flatMap((city) => city.assets ?? []).filter((asset) => asset.status === "licensed").map((asset) => asset.originalUrl),
].filter(Boolean).map(normalizedUrl));

function normalizedUrl(value) {
  try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return value; }
}

function plainText(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

async function requestJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "LvceTravelPlanner/1.0 (open-license image curation)" }, signal: AbortSignal.timeout(6_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

function qualityScore(page, info, city, subject) {
  const text = `${page.title} ${plainText(info.extmetadata?.ImageDescription?.value)}`.toLocaleLowerCase("en-US");
  const queryTerms = [city, subject, ...subject.split(/[—·（）()\s]/)].filter((term) => term.length >= 2);
  let score = queryTerms.reduce((sum, term) => sum + (text.includes(term.toLocaleLowerCase("en-US")) ? 12 : 0), 0);
  if (Number(info.width) >= 1400 || Number(info.thumbwidth) >= 1100) score += 5;
  if (/map|logo|icon|diagram|poster|screenshot|stamp|coin|banknote|flag/i.test(page.title)) score -= 100;
  if (/night|sunset|skyline|panorama|temple|museum|garden|lake|mountain|street|food|dish/i.test(text)) score += 2;
  return score;
}

async function findCandidate(city, target) {
  const queries = [
    `${target.subject} ${city}`,
    ...(target.queries ?? []),
    `${target.wikiTitle} ${city}`,
  ].filter(Boolean);
  for (const query of [...new Set(queries)].slice(0, 1)) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `${query} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "30",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size",
      iiurlwidth: "1440",
      format: "json",
      formatversion: "2",
      origin: "*",
    });
    let payload;
    try { payload = await requestJson(`https://commons.wikimedia.org/w/api.php?${params}`); } catch { continue; }
    const candidates = (payload.query?.pages ?? [])
      .flatMap((page) => (page.imageinfo ?? []).map((info) => ({ page, info })))
      .filter(({ info }) => /^image\/(jpeg|png|webp)$/i.test(info.mime ?? ""))
      .filter(({ info }) => /CC|public domain|PD|GFDL/i.test(plainText(info.extmetadata?.LicenseShortName?.value)))
      .filter(({ info }) => info.thumburl && info.descriptionurl && !used.has(normalizedUrl(info.url)))
      .map((candidate) => ({ ...candidate, score: qualityScore(candidate.page, candidate.info, city, target.subject), query }))
      .filter((candidate) => candidate.score > -20)
      .sort((a, b) => b.score - a.score);
    if (candidates[0]) return candidates[0];
  }
  return undefined;
}

async function processCity(city) {
  const cityEntry = manifest.cities[city.slug] ?? { city: city.city, assets: [] };
  const wanted = [
    city.targets.find((target) => target.category === "cover"),
    ...city.targets.filter((target) => target.category === "poi").slice(0, 2),
  ].filter(Boolean);
  const cityDirectory = path.join(outputRoot, city.slug);
  await mkdir(cityDirectory, { recursive: true });
  const foundAssets = [];
  let cityMissing = 0;
  for (let index = 0; index < wanted.length; index += 1) {
    const target = wanted[index];
    const existing = cityEntry.assets.find((asset) => asset.status === "licensed" && asset.category === target.category && asset.subject === target.subject);
    if (existing) continue;
    const candidate = await findCandidate(city.city, target);
    if (!candidate) { cityMissing += 1; continue; }
    let input;
    try {
      const response = await fetch(candidate.info.thumburl, { headers: { "user-agent": "LvceTravelPlanner/1.0 (open-license image curation)" }, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      input = Buffer.from(await response.arrayBuffer());
    } catch { cityMissing += 1; continue; }
    const width = target.category === "cover" ? 1440 : 1200;
    const height = target.category === "cover" ? 810 : 900;
    const fileName = `editorial-${index + 1}-${target.category}.webp`;
    const destination = path.join(cityDirectory, fileName);
    await sharp(input).rotate().resize(width, height, { fit: "cover", position: "attention", withoutEnlargement: false }).webp({ quality: 80, effort: 4 }).toFile(destination);
    const meta = candidate.info.extmetadata ?? {};
    const originalUrl = normalizedUrl(candidate.info.url);
    used.add(originalUrl);
    const asset = {
      status: "licensed",
      category: target.category,
      subject: target.subject,
      localPath: `/cities/media/${city.slug}/${fileName}`,
      alt: target.alt,
      title: candidate.page.title.replace(/^File:/, ""),
      author: plainText(meta.Artist?.value) || "Wikimedia Commons contributor",
      sourcePlatform: "Wikimedia Commons",
      sourcePage: candidate.info.descriptionurl,
      originalUrl,
      license: plainText(meta.LicenseShortName?.value) || "开放许可，详见来源页",
      licenseUrl: meta.LicenseUrl?.value || candidate.info.descriptionurl,
      retrievedAt: "2026-08-09",
      width,
      height,
      query: candidate.query,
      matchEvidence: `以“${candidate.query}”检索，候选文件为“${candidate.page.title.replace(/^File:/, "")}”；需人工复核地标内容`,
      reviewStatus: "pending",
    };
    foundAssets.push({ target, asset });
  }
  return { city, cityEntry, foundAssets, missing: cityMissing };
}

const pendingCities = [...targets.cities];
const results = [];
async function worker() {
  while (pendingCities.length) {
    const city = pendingCities.shift();
    if (!city) return;
    const result = await processCity(city);
    results.push(result);
    console.log(`${city.city}: 新增候选 ${result.foundAssets.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, () => worker()));

let added = 0;
let missing = 0;
for (const result of results) {
  const { city, cityEntry, foundAssets } = result;
  for (const { target, asset } of foundAssets) {
    const missingTarget = cityEntry.assets.find((item) => item.category === target.category && item.subject === target.subject);
    if (missingTarget) Object.assign(missingTarget, asset);
    else cityEntry.assets.push(asset);
    added += 1;
  }
  missing += result.missing;
  manifest.cities[city.slug] = cityEntry;
}

manifest.generatedAt = "2026-08-09";
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(path.join(root, "docs/city-media-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ cities: targets.cities.length, added, missing, totalLicensed: Object.values(manifest.cities).flatMap((city) => city.assets).filter((asset) => asset.status === "licensed").length }));
