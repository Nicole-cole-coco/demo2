import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const targetPerCity = 20;
const shardCount = Number.parseInt(process.argv[2] ?? "5", 10);
const cities = {};
const usedOriginals = new Set();
let previousCities = {};
const normalizedUrl = (value) => {
  try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return value; }
};
try {
  const coverManifest = JSON.parse((await readFile("public/cities/attribution.json", "utf8")).replace(/^\uFEFF/, ""));
  for (const item of coverManifest.items ?? []) usedOriginals.add(normalizedUrl(item.original_url));
} catch {}
try {
  previousCities = JSON.parse((await readFile("content/cities/media-manifest.json", "utf8")).replace(/^\uFEFF/, "")).cities ?? {};
} catch {}
for (let shard = 0; shard < shardCount; shard += 1) {
  const payload = JSON.parse((await readFile(`content/cities/media-shard-${shard}.json`, "utf8")).replace(/^\uFEFF/, ""));
  for (const [slug, city] of Object.entries(payload.cities ?? {})) {
    for (const asset of city.assets ?? []) {
      if (asset.status !== "licensed") continue;
      if (!asset.author) asset.author = "Wikimedia Commons contributor";
      const originalKey = normalizedUrl(asset.originalUrl);
      if (usedOriginals.has(originalKey)) {
        asset.status = "duplicate";
        asset.reason = "与其他城市或对象重复，前台不使用";
        if (asset.sourcePath) await unlink(path.resolve("public", asset.sourcePath.replace(/^\//, ""))).catch(() => undefined);
        delete asset.sourcePath;
      } else {
        usedOriginals.add(originalKey);
        if (asset.sourcePath) {
          const sourcePath = path.resolve("public", asset.sourcePath.replace(/^\//, ""));
          const destinationPath = path.resolve("public", asset.localPath.replace(/^\//, ""));
          await sharp(sourcePath).rotate().resize(1200, 800, { fit: "cover", position: "attention", withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toFile(destinationPath);
          await unlink(sourcePath).catch(() => undefined);
          delete asset.sourcePath;
        }
      }
    }
    cities[slug] = city;
  }
}
for (const [slug, previousCity] of Object.entries(previousCities)) {
  const nextCity = cities[slug] ?? { city: previousCity.city, assets: [] };
  for (const previousAsset of previousCity.assets ?? []) {
    if (previousAsset.status !== "licensed") continue;
    const current = nextCity.assets.find((asset) => asset.category === previousAsset.category && asset.subject === previousAsset.subject);
    if (current?.status === "licensed") continue;
    const originalKey = normalizedUrl(previousAsset.originalUrl ?? previousAsset.sourcePage);
    if (usedOriginals.has(originalKey)) continue;
    usedOriginals.add(originalKey);
    if (current) Object.assign(current, previousAsset);
    else nextCity.assets.push(previousAsset);
  }
  cities[slug] = nextCity;
}
const manifest = {
  generatedAt: "2026-08-09",
  targetPerCity,
  policy: "仅收录具备明确开放许可与原始来源页的本地 WebP；跨城市重复项被标记并从前台排除。",
  cities,
};
await writeFile("content/cities/media-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile("docs/city-media-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const licensed = Object.values(cities).flatMap((city) => city.assets).filter((asset) => asset.status === "licensed").length;
const missing = Object.values(cities).flatMap((city) => city.assets).filter((asset) => asset.status !== "licensed").length;
console.log(JSON.stringify({ cities: Object.keys(cities).length, licensed, missing, uniqueOriginals: usedOriginals.size }));
