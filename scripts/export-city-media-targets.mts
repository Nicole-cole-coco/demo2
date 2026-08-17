import { writeFile } from "node:fs/promises";
import { PUBLISHED_CITY_GUIDES } from "../content/cities/index.ts";

type PublishedGuide = (typeof PUBLISHED_CITY_GUIDES)[number];

function uniqueNames(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const value of values) {
    const name = value?.normalize("NFKC").replace(/\s+/g, " ").trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

function foodSubjects(guide: PublishedGuide) {
  const subjects = uniqueNames([
    ...guide.foods.map((item) => item.name),
    ...guide.restaurants.flatMap((restaurant) => restaurant.order),
  ]);
  if (subjects.length < 6) {
    throw new Error(`${guide.city}只有 ${subjects.length} 个可追溯到现有内容的不同食物名称，无法生成 6 个真实美食图片目标`);
  }
  return subjects.slice(0, 6);
}

const cities = PUBLISHED_CITY_GUIDES.map((guide) => {
  const foods = foodSubjects(guide);
  const targets = [
    { category: "cover", subject: guide.city, wikiTitle: guide.city, alt: `${guide.city}城市标志性首图`, queries: [`${guide.city} landmark`] },
    ...guide.experiences.slice(0, 6).map((item) => ({ category: "poi", subject: item.name, wikiTitle: item.name.split(/[—（]/)[0], alt: `${guide.city}${item.name}景观`, queries: [`${item.name.split(/[—（]/)[0]} ${guide.city}`] })),
    ...foods.map((name) => ({ category: "food", subject: name, wikiTitle: name, alt: `${guide.city}特色食物${name}`, queries: [`${name} ${guide.city} food`] })),
    ...guide.restaurants.slice(0, 4).map((item) => ({ category: "restaurant", subject: item.name, wikiTitle: item.order[0], alt: `${guide.city}${item.name}代表菜${item.order[0]}`, queries: [`${item.order[0]} ${guide.city} cuisine`] })),
    ...guide.neighborhoods.slice(0, 3).map((item) => ({ category: "lifestyle", subject: item.name, wikiTitle: item.name, alt: `${guide.city}${item.name}街区与城市生活`, queries: [`${item.name} ${guide.city}`] })),
  ];
  if (targets.length !== 20) throw new Error(`${guide.city}图片目标数量不是 20：${targets.length}`);
  return { city: guide.city, slug: guide.slug, targets };
});

const generatedAt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
await writeFile("docs/city-media-targets.json", `${JSON.stringify({ generatedAt, cities }, null, 2)}\n`, "utf8");
console.log(`${cities.length} cities / ${cities.reduce((sum, city) => sum + city.targets.length, 0)} targets`);
