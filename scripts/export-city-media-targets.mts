import { writeFile } from "node:fs/promises";
import { PUBLISHED_CITY_GUIDES } from "../content/cities/index.ts";

const cities = PUBLISHED_CITY_GUIDES.map((guide) => ({
  city: guide.city,
  slug: guide.slug,
  targets: [
    { category: "cover", subject: guide.city, wikiTitle: guide.city, alt: `${guide.city}城市标志性首图`, queries: [`${guide.city} landmark`] },
    ...guide.experiences.slice(0, 6).map((item) => ({ category: "poi", subject: item.name, wikiTitle: item.name.split(/[—（]/)[0], alt: `${guide.city}${item.name}景观`, queries: [`${item.name.split(/[—（]/)[0]} ${guide.city}`] })),
    ...guide.foods.slice(0, 6).map((item) => ({ category: "food", subject: item.name, wikiTitle: item.name, alt: `${guide.city}特色食物${item.name}`, queries: [`${item.name} ${guide.city} food`] })),
    ...guide.restaurants.slice(0, 4).map((item) => ({ category: "restaurant", subject: item.name, wikiTitle: item.order[0], alt: `${guide.city}${item.name}代表菜${item.order[0]}`, queries: [`${item.order[0]} ${guide.city} cuisine`] })),
    ...guide.neighborhoods.slice(0, 3).map((item) => ({ category: "lifestyle", subject: item.name, wikiTitle: item.name, alt: `${guide.city}${item.name}街区与城市生活`, queries: [`${item.name} ${guide.city}`] })),
  ],
}));

await writeFile("docs/city-media-targets.json", `${JSON.stringify({ generatedAt: "2026-08-09", cities }, null, 2)}\n`, "utf8");
console.log(`${cities.length} cities / ${cities.reduce((sum, city) => sum + city.targets.length, 0)} targets`);
