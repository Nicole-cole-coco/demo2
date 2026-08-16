import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PUBLISHED_CITY_GUIDES } from "../content/cities/index.ts";

const CHECKED_AT = "2026-08-09";
const OUTPUT = path.resolve("content/cities/research-manifest.json");
const DOC_OUTPUT = path.resolve("docs/city-research-manifest.json");
const USER_AGENT = "Mozilla/5.0 (compatible; LvceTravelResearch/1.0; public search index research)";
const OFFICIAL_HOSTS = [
  ".gov.cn", "dpm.org.cn", "chnmuseum.cn", "npm.gov.tw", "hkpm.org.hk",
  "macaumuseum.gov.mo", "louvre", "museum", "metro", "airport", "railway",
];

type SearchResult = { title: string; url: string; snippet: string };

function decodeEntities(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBingUrl(rawUrl: string) {
  const decoded = decodeEntities(rawUrl);
  try {
    const parsed = new URL(decoded);
    const encoded = parsed.searchParams.get("u");
    if (encoded?.startsWith("a1")) {
      return Buffer.from(encoded.slice(2), "base64url").toString("utf8");
    }
  } catch {}
  return decoded;
}

function parseBing(html: string): SearchResult[] {
  return [...html.matchAll(/<li class="b_algo"[\s\S]*?<\/li>/g)].flatMap((match) => {
    const block = match[0];
    const anchor = block.match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor) return [];
    const snippet = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
    return [{ title: decodeEntities(anchor[2]), url: decodeBingUrl(anchor[1]), snippet: decodeEntities(snippet) }];
  });
}

async function search(query: string) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=20&setlang=zh-hans`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parseBing(await response.text());
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 900));
    }
  }
  return [];
}

function isXhsNote(url: string) {
  try {
    const parsed = new URL(url);
    return /(^|\.)xiaohongshu\.com$/i.test(parsed.hostname) && /\/(explore|discovery\/item)\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isOfficial(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return OFFICIAL_HOSTS.some((token) => host.endsWith(token) || host.includes(token));
  } catch {
    return false;
  }
}

const cities: Record<string, unknown> = {};
for (const [index, guide] of PUBLISHED_CITY_GUIDES.entries()) {
  const xhsQueries = [
    `site:xiaohongshu.com/explore ${guide.city} 旅行攻略 避坑`,
    `site:xiaohongshu.com/explore ${guide.city} 本地人 美食 citywalk`,
    `site:xiaohongshu.com/explore ${guide.city} 少排队 雨天 小众`,
  ];
  const xhsResults: Array<SearchResult & { query: string }> = [];
  for (const query of xhsQueries) {
    const results = await search(query);
    for (const result of results.filter((item) => isXhsNote(item.url))) {
      if (!xhsResults.some((item) => item.url === result.url)) xhsResults.push({ ...result, query });
      if (xhsResults.length >= 5) break;
    }
    if (xhsResults.length >= 5) break;
    await new Promise((resolve) => setTimeout(resolve, 260));
  }

  const officialResults: Array<SearchResult & { query: string; subject: string }> = [];
  for (const experience of guide.experiences.slice(0, 3)) {
    const query = `${experience.name} 官方 开放时间 预约 参观`;
    const results = await search(query);
    const official = results.find((item) => isOfficial(item.url));
    if (official && !officialResults.some((item) => item.url === official.url)) {
      officialResults.push({ ...official, query, subject: experience.name });
    }
    if (officialResults.length >= 2) break;
    await new Promise((resolve) => setTimeout(resolve, 260));
  }

  cities[guide.slug] = {
    city: guide.city,
    xiaohongshu: xhsResults.slice(0, 5).map((item) => ({
      title: item.title,
      url: item.url,
      visibleSummary: item.snippet,
      query: item.query,
      access: "public-search-index",
      checkedAt: CHECKED_AT,
      usageBoundary: "仅用于识别高频体验问题；未绕过登录，未复制原文或图片。",
    })),
    official: officialResults.slice(0, 2).map((item) => ({
      title: item.title,
      url: item.url,
      visibleSummary: item.snippet,
      subject: item.subject,
      query: item.query,
      checkedAt: CHECKED_AT,
      sourceType: "official-detail-candidate",
    })),
  };
  console.log(`[${index + 1}/${PUBLISHED_CITY_GUIDES.length}] ${guide.city}: XHS ${xhsResults.length}, official ${officialResults.length}`);
  await new Promise((resolve) => setTimeout(resolve, 320));
}

const manifest = {
  generatedAt: CHECKED_AT,
  policy: "小红书仅记录公开搜索可见的单篇索引或摘要，不绕过登录；动态事实另以官方详情页交叉核验。",
  cities,
};
await writeFile(OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(DOC_OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Saved ${Object.keys(cities).length} cities.`);
