"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CITY_REGIONS,
  CITY_SEASONS,
  CITY_SORTS,
  PUBLISHED_CITY_GUIDES,
  TRAVEL_INTERESTS,
  cityCardPresentation,
  comparisonLevel,
  discoverCities,
  isCitySort,
  isRegionFilter,
  isSeasonFilter,
  nearestCities,
  searchCities,
  type CityPreference,
  type DiscoveryFilters,
} from "@/content/cities";
import CityRecommender from "@/app/components/CityRecommender";
import MyTravelDrawer, { notifyPersonalTravelChanged } from "@/app/components/MyTravelDrawer";

const DEFAULT_FILTERS: DiscoveryFilters = {
  query: "",
  preference: "全部",
  region: "全部地区",
  season: "全年适合",
  sort: "综合推荐",
};

function isPreference(value: string): value is CityPreference {
  return TRAVEL_INTERESTS.includes(value as CityPreference);
}

function filtersFromUrl(url: URL): DiscoveryFilters {
  const preference = url.searchParams.get("pref") ?? "全部";
  const region = url.searchParams.get("region") ?? "全部地区";
  const season = url.searchParams.get("season") ?? "全年适合";
  const sort = url.searchParams.get("sort") ?? "综合推荐";
  return {
    query: url.searchParams.get("q") ?? "",
    preference: preference === "全部" || isPreference(preference) ? preference : "全部",
    region: isRegionFilter(region) ? region : "全部地区",
    season: isSeasonFilter(season) ? season : "全年适合",
    sort: isCitySort(sort) ? sort : "综合推荐",
  };
}

function urlForFilters(filters: DiscoveryFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.preference !== "全部") params.set("pref", filters.preference);
  if (filters.region !== "全部地区") params.set("region", filters.region);
  if (filters.season !== "全年适合") params.set("season", filters.season);
  if (filters.sort !== "综合推荐") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `/?${query}#cities` : "/#cities";
}

function cityHref(slug: string, preference: DiscoveryFilters["preference"]) {
  return preference === "全部" ? `/city/${slug}` : `/city/${slug}?preference=${encodeURIComponent(preference)}`;
}

function consumptionNote(value: string) {
  const amounts = value.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ""))) ?? [];
  const ceiling = amounts.length ? Math.max(...amounts) : 0;
  if (ceiling && ceiling <= 600) return "日常餐饮与市内移动较容易控制";
  if (ceiling >= 1000) return "核心区住宿与代表餐厅通常支出较高";
  return "丰俭由人，住宿位置对支出影响较大";
}

function savedFilters(value: unknown): DiscoveryFilters | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<DiscoveryFilters>;
  const preference = item.preference === "全部" || (typeof item.preference === "string" && isPreference(item.preference)) ? item.preference : "全部";
  const region = typeof item.region === "string" && isRegionFilter(item.region) ? item.region : "全部地区";
  const season = typeof item.season === "string" && isSeasonFilter(item.season) ? item.season : "全年适合";
  const sort = typeof item.sort === "string" && isCitySort(item.sort) ? item.sort : "综合推荐";
  return { query: typeof item.query === "string" ? item.query : "", preference, region, season, sort };
}

export default function Home() {
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareNotice, setCompareNotice] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const applyLocation = () => {
      const url = new URL(window.location.href);
      let next = filtersFromUrl(url);
      if (!["q", "pref", "region", "season", "sort"].some((key) => url.searchParams.has(key))) {
        try { next = savedFilters(JSON.parse(localStorage.getItem("lvce-last-city-filters") ?? "null")) ?? next; } catch { /* 损坏的筛选记录忽略 */ }
      }
      setFilters(next);
      setSearchInput(next.query);
    };
    const timer = window.setTimeout(() => {
      applyLocation();
      try {
        setFavoriteSlugs(JSON.parse(localStorage.getItem("lvce-favorite-cities") ?? "[]"));
        setRecentSlugs(JSON.parse(localStorage.getItem("lvce-recent-cities") ?? "[]"));
      } catch { /* 本地记录损坏时保持匿名空状态 */ }
    }, 0);
    window.addEventListener("popstate", applyLocation);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", applyLocation);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const commitFilters = (patch: Partial<DiscoveryFilters>, history: "push" | "replace" = "push") => {
    const next = { ...filters, ...patch };
    setFilters(next);
    if (typeof window !== "undefined") {
      window.history[history === "push" ? "pushState" : "replaceState"]({}, "", urlForFilters(next));
      try { localStorage.setItem("lvce-last-city-filters", JSON.stringify(next)); } catch { /* 无法持久化时筛选仍可在当前页面使用 */ }
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchFocused(false);
    commitFilters(DEFAULT_FILTERS);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commitFilters({ query: searchInput.trim() });
    setSearchFocused(false);
  };

  const toggleFavorite = (slug: string) => {
    const guide = PUBLISHED_CITY_GUIDES.find((item) => item.slug === slug);
    const removing = favoriteSlugs.includes(slug);
    const next = removing ? favoriteSlugs.filter((item) => item !== slug) : [...favoriteSlugs, slug];
    setFavoriteSlugs(next);
    try {
      localStorage.setItem("lvce-favorite-cities", JSON.stringify(next));
      notifyPersonalTravelChanged();
      setToast(removing ? `已取消收藏${guide?.city ?? "城市"}` : `已收藏${guide?.city ?? "城市"}`);
    } catch { setToast("当前浏览器无法保存收藏"); }
  };

  const toggleCompare = (slug: string) => {
    setCompareNotice("");
    setCompareSlugs((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 3) {
        setCompareNotice("一次最多对比 3 座城市，请先移除一座。");
        return current;
      }
      return [...current, slug];
    });
  };

  const matches = useMemo(() => discoverCities(PUBLISHED_CITY_GUIDES, filters), [filters]);
  const suggestionMatches = useMemo(() => searchInput.trim() ? searchCities(PUBLISHED_CITY_GUIDES, searchInput).slice(0, 6) : [], [searchInput]);
  const closest = useMemo(() => nearestCities(PUBLISHED_CITY_GUIDES, filters), [filters]);
  const favoriteCities = PUBLISHED_CITY_GUIDES.filter((guide) => favoriteSlugs.includes(guide.slug));
  const recentCities = recentSlugs.map((slug) => PUBLISHED_CITY_GUIDES.find((guide) => guide.slug === slug)).filter((guide): guide is (typeof PUBLISHED_CITY_GUIDES)[number] => Boolean(guide));
  const compareCities = compareSlugs.map((slug) => PUBLISHED_CITY_GUIDES.find((guide) => guide.slug === slug)).filter((guide): guide is (typeof PUBLISHED_CITY_GUIDES)[number] => Boolean(guide));
  const activeLabels = [filters.query && `搜索“${filters.query}”`, filters.preference !== "全部" && filters.preference, filters.region !== "全部地区" && filters.region, filters.season !== "全年适合" && filters.season].filter(Boolean);

  const filterControls = (
    <>
      <label><span>地区</span><select aria-label="地区" value={filters.region} onChange={(event) => commitFilters({ region: event.target.value as DiscoveryFilters["region"] })}>{CITY_REGIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>季节</span><select aria-label="季节" value={filters.season} onChange={(event) => commitFilters({ season: event.target.value as DiscoveryFilters["season"] })}>{CITY_SEASONS.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>排序</span><select aria-label="排序" value={filters.sort} onChange={(event) => commitFilters({ sort: event.target.value as DiscoveryFilters["sort"] })}>{CITY_SORTS.map((item) => <option key={item}>{item}</option>)}</select></label>
    </>
  );

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="旅策首页"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></Link>
        <nav aria-label="主导航"><a href="#cities">选城市</a><a href="#cities">按兴趣筛选</a><MyTravelDrawer onToast={setToast} /></nav>
      </header>

      <section className="hero home-editorial-hero" id="top">
        <Image className="hero-image" src="/cities/hangzhou.jpg" alt="杭州西湖湖面与群山" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="eyebrow">CHINA CITY FIELD GUIDE</p>
          <h1>把零散经验，<br /><em>整理成可以直接照着走的攻略。</em></h1>
          <p>不用再翻十几篇旅行笔记。旅策把路线、吃饭、取舍、排队与替代方案放进同一份城市专刊。</p>
          <div className="hero-actions"><a href="#cities" className="primary">选择一座城市 <span>↗</span></a><a href="#cities" className="ghost">按兴趣找路线</a></div>
        </div>
      </section>

      <section className="city-section launch-city-section" id="cities">
        <div className="discovery-heading-row">
          <div className="discovery-heading">
            <p className="eyebrow dark">中国城市旅行指南 · {PUBLISHED_CITY_GUIDES.length}</p>
            <h2>找到适合你的中国城市与旅行方式</h2>
            <p>搜索一座城、一种味道或一个旅行问题，再用偏好和季节缩小范围。</p>
          </div>
          <CityRecommender />
        </div>

        <div className="discovery-search-wrap">
          <form className="city-search-form" role="search" onSubmit={submitSearch}>
            <span aria-hidden="true">⌕</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                commitFilters({ query: searchInput.trim() });
                setSearchFocused(false);
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
              placeholder="搜索成都、火锅、故宫，或问‘夏天适合避暑的城市’"
              aria-label="搜索城市、内容或旅行问题"
              autoComplete="off"
            />
            {searchInput && <button className="search-clear" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearchInput(""); commitFilters({ query: "" }); }}>清除</button>}
            <button className="search-submit" type="submit">搜索</button>
          </form>
          {searchFocused && searchInput.trim() && <div className="search-suggestions" role="listbox" aria-label="搜索建议">
            {suggestionMatches.length ? suggestionMatches.map(({ guide, reason, kind }) => (
              <Link role="option" aria-selected="false" href={cityHref(guide.slug, filters.preference)} key={guide.slug}>
                <Image src={guide.image} alt="" width={72} height={52} />
                <span><b>{guide.city}</b><small>{guide.region} · {guide.recommendedSeasons.join(" / ")}</small><em>{kind}匹配 · {reason}</em></span>
                <i>查看攻略 ↗</i>
              </Link>
            )) : <div className="suggestion-empty">暂时没有直接结果，按回车查看接近的城市。</div>}
          </div>}
        </div>

        <div className="preference-block">
          <span>旅行偏好</span>
          <div className="interest-filter" aria-label="按兴趣筛选">
            {["全部", ...TRAVEL_INTERESTS].map((item) => <button type="button" key={item} aria-pressed={filters.preference === item} className={filters.preference === item ? "active" : ""} onClick={() => commitFilters({ preference: item as DiscoveryFilters["preference"] })}>{item}</button>)}
          </div>
        </div>

        <div className="city-filter-row desktop-filters">
          {filterControls}
          <button type="button" className="filter-clear" onClick={clearFilters}>清除筛选</button>
          <p>当前找到 <b>{matches.length}</b> 座城市</p>
        </div>
        <div className="mobile-result-bar">
          <p>找到 <b>{matches.length}</b> 座城市</p>
          <details className="mobile-filter-drawer">
            <summary>筛选</summary>
            <div>{filterControls}<button type="button" className="filter-clear" onClick={clearFilters}>清除筛选</button></div>
          </details>
        </div>

        {filters.query && <div className="search-summary"><b>“{filters.query}”</b><span>已按城市资料、景点、美食、餐厅、街区和本地旅行规则整理结果；无需接入 AI 也可使用。</span></div>}

        <div className="city-grid launch-city-grid">
          {matches.map((match) => {
            const { guide } = match;
            const presentation = cityCardPresentation(guide, filters.preference, filters.query ? match : undefined);
            const selected = compareSlugs.includes(guide.slug);
            const favorite = favoriteSlugs.includes(guide.slug);
            return (
              <article className="discovery-city-card" key={guide.slug}>
                <Link className="city-card-primary" href={cityHref(guide.slug, filters.preference)} aria-label={`打开${guide.city}旅行攻略`}>
                  <div className="discovery-card-image">
                    <Image src={guide.cardImage} alt={guide.cardImageAlt} fill sizes="(max-width: 760px) 100vw, 33vw" />
                    <span>{guide.region} · {guide.province}</span>
                  </div>
                  <div className="discovery-card-copy">
                    <div className="discovery-card-title"><h3>{guide.city}</h3><span>{guide.recommendedSeasons.join(" / ")} · {guide.idealDays}</span></div>
                    <div className="city-tag-row">{guide.travelTags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <p className="match-reason"><b>为什么匹配</b>{presentation.reason}</p>
                    <dl>
                      <div><dt>代表景点</dt><dd>{guide.experiences.slice(0, 3).map((item) => item.name).join("、")}</dd></div>
                      <div><dt>代表美食</dt><dd>{guide.foods.slice(0, 3).map((item) => item.name).join("、")}</dd></div>
                      <div className="card-route-summary"><dt>{presentation.routeSummary.title}</dt><dd>
                        <ol>{presentation.routeSummary.days.map((day) => <li key={`${day.label}-${day.area}`}><b>{day.label}</b><span>{day.sequence}</span></li>)}</ol>
                        <ul>
                          <li><b>交通</b><span>{presentation.routeSummary.transport}</span></li>
                          <li><b>强度</b><span>{presentation.routeSummary.pace}</span></li>
                          <li><b>适合</b><span>{presentation.routeSummary.suitable}</span></li>
                          <li><b>取舍</b><span>{presentation.routeSummary.removable}</span></li>
                        </ul>
                      </dd></div>
                    </dl>
                    <div className="preference-evidence"><b>{presentation.focusTitle}</b>{presentation.focusLines.slice(0, 3).map((line) => <span key={line}>{line}</span>)}</div>
                  </div>
                </Link>
                <div className="discovery-card-actions">
                  <Link href={cityHref(guide.slug, filters.preference)}>查看城市攻略 <span>↗</span></Link>
                  <button type="button" aria-pressed={favorite} onClick={() => toggleFavorite(guide.slug)}>{favorite ? "已收藏" : "收藏"}</button>
                  <button type="button" aria-pressed={selected} onClick={() => toggleCompare(guide.slug)}>{selected ? "已加入对比" : "加入对比"}</button>
                </div>
              </article>
            );
          })}
        </div>

        {!matches.length && <section className="empty-state discovery-empty">
          <p className="eyebrow dark">没有完全重合的结果</p>
          <h3>{activeLabels.length ? activeLabels.join(" + ") : "当前条件"}暂时没有匹配城市</h3>
          <p>可以先清除一项条件，或从下面三个最接近的候选继续查看。</p>
          <button type="button" onClick={clearFilters}>一键清除筛选</button>
          <div>{closest.map(({ guide, reason }) => <Link href={cityHref(guide.slug, filters.preference)} key={guide.slug}><b>{guide.city}</b><span>{reason}</span></Link>)}</div>
        </section>}

        {compareSlugs.length > 0 && <aside className="compare-tray" aria-label="城市对比">
          <div><span>城市对比 · 已选 {compareSlugs.length}/3</span><nav>{compareCities.map((guide) => <button type="button" key={guide.slug} onClick={() => toggleCompare(guide.slug)}>{guide.city} ×</button>)}</nav>{compareNotice && <small>{compareNotice}</small>}</div>
          <button type="button" disabled={compareSlugs.length < 2} onClick={() => setCompareOpen(true)}>对比所选城市</button>
        </aside>}

        {compareOpen && compareCities.length >= 2 && <section className="city-comparison" aria-label="城市对比结果">
          <header><div><p className="eyebrow dark">CITY COMPARISON</p><h3>哪座城市更适合这次出发</h3></div><button type="button" onClick={() => setCompareOpen(false)}>收起对比</button></header>
          <div className="comparison-scroll"><table><thead><tr><th>对比维度</th>{compareCities.map((guide) => <th key={guide.slug}>{guide.city}</th>)}</tr></thead><tbody>
            <tr><th>推荐季节</th>{compareCities.map((guide) => <td key={guide.slug}>{guide.recommendedSeasons.join("、")}</td>)}</tr>
            <tr><th>适合天数</th>{compareCities.map((guide) => <td key={guide.slug}>{guide.idealDays}</td>)}</tr>
            <tr><th>旅行节奏</th>{compareCities.map((guide) => <td key={guide.slug}>{comparisonLevel(guide, "松弛休息")}</td>)}</tr>
            <tr><th>主要看点</th>{compareCities.map((guide) => <td key={guide.slug}>{guide.travelTags.slice(0, 3).join("、")}</td>)}</tr>
            <tr><th>美食丰富度</th>{compareCities.map((guide) => <td key={guide.slug}>{comparisonLevel(guide, "地道美食")}</td>)}</tr>
            <tr><th>自然风景</th>{compareCities.map((guide) => <td key={guide.slug}>{comparisonLevel(guide, "自然风景")}</td>)}</tr>
            <tr><th>博物馆</th>{compareCities.map((guide) => <td key={guide.slug}>{comparisonLevel(guide, "博物馆")}</td>)}</tr>
            <tr><th>夜生活</th>{compareCities.map((guide) => <td key={guide.slug}>{comparisonLevel(guide, "夜生活")}</td>)}</tr>
            <tr><th>步行强度</th>{compareCities.map((guide) => <td key={guide.slug}>{/山|坡|徒步/.test(guide.transit) ? "较高" : /步行/.test(guide.transit) ? "中等" : "较低"}</td>)}</tr>
            <tr><th>排队应对</th>{compareCities.map((guide) => <td key={guide.slug}>{comparisonLevel(guide, "少排队")}：{guide.routes.find((route) => route.days === 3)?.crowdAdvice ?? guide.experiences[0].pitfall}</td>)}</tr>
            <tr><th>雨天韧性</th>{compareCities.map((guide) => <td key={guide.slug}>{guide.rainyPlans.length >= 3 ? "已有三套室内或同区替代" : "需要额外准备雨天方案"}；{guide.rainyPlans[0]}</td>)}</tr>
            <tr><th>少折返</th>{compareCities.map((guide) => <td key={guide.slug}>{comparisonLevel(guide, "少折返")}</td>)}</tr>
            <tr><th>消费特点</th>{compareCities.map((guide) => <td key={guide.slug}>{consumptionNote(guide.dailyBudget)}</td>)}</tr>
            <tr><th>交通便利</th>{compareCities.map((guide) => <td key={guide.slug}>{guide.transit}</td>)}</tr>
            <tr><th>更适合谁</th>{compareCities.map((guide) => <td key={guide.slug}>{guide.fit} 推荐理由：{cityCardPresentation(guide, filters.preference).reason}</td>)}</tr>
          </tbody></table></div>
        </section>}

        {(favoriteCities.length > 0 || recentCities.length > 0) && <section className="personal-city-shelf" aria-label="我的城市记录">
          {favoriteCities.length > 0 && <div><span>我的收藏</span><nav>{favoriteCities.map((guide) => <Link href={cityHref(guide.slug, filters.preference)} key={guide.slug}>{guide.city}</Link>)}</nav></div>}
          {recentCities.length > 0 && <div><span>最近浏览</span><nav>{recentCities.slice(0, 6).map((guide) => <Link href={cityHref(guide.slug, filters.preference)} key={guide.slug}>{guide.city}</Link>)}</nav></div>}
        </section>}
      </section>

      <section className="home-boundary"><p>每座城市都有独立链接；收藏、最近浏览和已保存行程只保存在当前设备，不要求登录。</p></section>

      <footer><Link className="brand" href="/"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></Link><p>中国城市实用旅行攻略 · 路线、餐厅与取舍一次整理清楚</p><small>© 2026 旅策</small></footer>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
