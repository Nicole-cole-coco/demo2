import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const manifest = JSON.parse((await readFile("content/cities/media-manifest.json", "utf8")).replace(/^\uFEFF/, ""));
const rows = Object.values(manifest.cities).flatMap((city) => (city.assets ?? [])
  .filter((asset) => asset.status === "licensed" && asset.localPath)
  .map((asset) => ({ city: city.city, ...asset })));
const columns = 5;
const tileWidth = 260;
const tileHeight = 205;
const canvas = sharp({ create: { width: columns * tileWidth, height: Math.ceil(rows.length / columns) * tileHeight, channels: 3, background: "#f2efe8" } });
const composites = [];
for (let index = 0; index < rows.length; index += 1) {
  const item = rows[index];
  const image = await sharp(path.resolve("public", item.localPath.replace(/^\//, ""))).resize(244, 150, { fit: "cover" }).webp().toBuffer();
  const label = `${item.city}｜${item.subject}`.replace(/[&<>]/g, "");
  const caption = Buffer.from(`<svg width="244" height="42" xmlns="http://www.w3.org/2000/svg"><rect width="244" height="42" fill="#e7e4dc"/><text x="8" y="17" font-family="Microsoft YaHei, sans-serif" font-size="12" fill="#27302d">${label.slice(0, 18)}</text><text x="8" y="34" font-family="Arial, sans-serif" font-size="9" fill="#646b67">${item.category}</text></svg>`);
  const left = (index % columns) * tileWidth + 8;
  const top = Math.floor(index / columns) * tileHeight + 8;
  composites.push({ input: image, left, top }, { input: caption, left, top: top + 150 });
}
await canvas.composite(composites).webp({ quality: 82 }).toFile("docs/image-contact-sheet.webp");
console.log(JSON.stringify({ images: rows.length, output: "docs/image-contact-sheet.webp" }));
