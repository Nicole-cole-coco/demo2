import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import mediaManifest from "../content/cities/media-manifest.json";
import coverAttribution from "../public/cities/attribution.json";
import targets from "../docs/city-media-targets.json";

type MediaAsset = { status: string; category: string; localPath?: string };
type Manifest = { cities: Record<string, { assets: MediaAsset[] }> };
type Attribution = { items: Array<{ slug: string; local_path: string }> };
type TargetCatalog = { cities: Array<{ city: string; slug: string }> };

const publicRoot = path.resolve("public");
const cardsRoot = path.join(publicRoot, "cities", "cards");
const heroesRoot = path.join(publicRoot, "cities", "heroes");
await Promise.all([mkdir(cardsRoot, { recursive: true }), mkdir(heroesRoot, { recursive: true })]);

async function coverSource(slug: string) {
  const generated = (mediaManifest as Manifest).cities[slug]?.assets.find((asset) => asset.status === "licensed" && asset.category === "cover" && asset.localPath)?.localPath;
  const attributed = (coverAttribution as Attribution).items.find((item) => item.slug === slug)?.local_path;
  const candidates = [generated, attributed, `/cities/${slug}.jpg`, `/cities/${slug}.webp`, `/cities/${slug}.png`].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const absolutePath = path.join(publicRoot, candidate.replace(/^\//, ""));
    try { await access(absolutePath); return absolutePath; } catch { /* try next source */ }
  }
  throw new Error(`缺少${slug}首图源文件`);
}

let cards = 0;
let heroes = 0;
let normalized = 0;

for (const city of (targets as TargetCatalog).cities) {
  const sourcePath = await coverSource(city.slug);
  const coverBuffer = await readFile(sourcePath);
  await sharp(coverBuffer).rotate().resize(1440, 810, { fit: "cover", position: "attention", withoutEnlargement: false }).webp({ quality: 80, effort: 4 }).toFile(path.join(heroesRoot, `${city.slug}.webp`));
  await sharp(coverBuffer).rotate().resize(1200, 800, { fit: "cover", position: "attention", withoutEnlargement: false }).webp({ quality: 80, effort: 4 }).toFile(path.join(cardsRoot, `${city.slug}.webp`));
  heroes += 1;
  cards += 1;
}

for (const city of Object.values((mediaManifest as Manifest).cities)) {
  for (const image of city.assets.filter((item) => item.status === "licensed" && item.localPath)) {
    const absolutePath = path.join(publicRoot, image.localPath!.replace(/^\//, ""));
    const source = await readFile(absolutePath);
    const width = image.category === "cover" ? 1440 : 1200;
    const height = image.category === "cover" ? 810 : 900;
    const output = await sharp(source).rotate().resize(width, height, { fit: "cover", position: "attention", withoutEnlargement: false }).webp({ quality: 80, effort: 4 }).toBuffer();
    await writeFile(absolutePath, output);
    normalized += 1;
  }
}

console.log(JSON.stringify({ cities: (targets as TargetCatalog).cities.length, heroImages: heroes, cardImages: cards, normalizedImages: normalized }));
