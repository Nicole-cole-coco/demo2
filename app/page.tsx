"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EDITORIAL_CITY_GUIDES, TRAVEL_INTERESTS } from "@/lib/editorial-city-guides";

export default function Home() {
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState<string>("全部");

  const visibleCities = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return EDITORIAL_CITY_GUIDES.filter((guide) => {
      const searchable = [
        guide.city,
        guide.province,
        guide.intro,
        guide.fit,
        ...guide.themes.map((item) => `${item.title} ${item.audience} ${item.advice}`),
        ...guide.foods.map((item) => item.name),
      ].join(" ").toLowerCase();
      const matchesQuery = !keyword || searchable.includes(keyword);
      const matchesInterest = interest === "全部" || searchable.includes(interest.toLowerCase());
      return matchesQuery && matchesInterest;
    });
  }, [interest, query]);

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="旅策首页">
          <span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div>
        </Link>
        <nav aria-label="主导航"><a href="#cities">选城市</a><a href="#method">怎么整理</a></nav>
      </header>

      <section className="hero home-editorial-hero" id="top">
        <Image className="hero-image" src="/cities/hangzhou.jpg" alt="杭州西湖湖面与群山" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="eyebrow">CHINA CITY FIELD GUIDE</p>
          <h1>把零散经验，<br /><em>整理成可以直接照着走的攻略。</em></h1>
          <p>不用再翻十几篇旅行笔记。旅策把路线、吃饭、取舍、排队与替代方案放进同一份城市专刊，先告诉你今天怎么走，也告诉你累了可以删什么。</p>
          <div className="hero-actions"><a href="#cities" className="primary">选择一座城市 <span>↗</span></a><a href="#method" className="ghost">看看整理方法</a></div>
        </div>
        <div className="hero-insight editorial-promise">
          <span>不是更多信息</span>
          <h2>是一条明确主路线，<br />和每一步的取舍理由。</h2>
          <div><b>上午去哪里</b><b>午晚餐吃什么</b><b>太累删什么</b></div>
        </div>
      </section>

      <section className="editorial-method" id="method">
        <div><p className="eyebrow dark">THE EDITORIAL METHOD</p><h2>攻略先解决真实问题，<br />再列景点。</h2></div>
        <ol>
          <li><span>01</span><div><b>先决定片区</b><p>同一天只走一个主要片区，减少折返和临时打车。</p></div></li>
          <li><span>02</span><div><b>把餐厅放进路线</b><p>代表菜不是另一张清单，而是当天顺路的一顿饭。</p></div></li>
          <li><span>03</span><div><b>同时给出删减项</b><p>天气、体力或排队变化时，知道先删什么，不推翻整天计划。</p></div></li>
          <li><span>04</span><div><b>事实与经验分开</b><p>预约看官方，主观体验做交叉整理；有争议就明确说有争议。</p></div></li>
        </ol>
      </section>

      <section className="city-section launch-city-section" id="cities">
        <div className="section-title">
          <div>
            <p className="eyebrow dark">EDITORIAL CITY GUIDES · {EDITORIAL_CITY_GUIDES.length}</p>
            <h2>先把三座城市做到真正能用</h2>
            <p>首页只展示已有完整路线、餐厅建议、删减项与雨天方案的城市。其他城市不会在找不到内容时悄悄回到杭州。</p>
          </div>
          <label className="city-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索城市、食物或旅行问题" /></label>
        </div>

        <div className="interest-filter" aria-label="按兴趣筛选">
          {["全部", ...TRAVEL_INTERESTS].map((item) => <button type="button" key={item} className={interest === item ? "active" : ""} onClick={() => setInterest(item)}>{item}</button>)}
        </div>

        <div className="city-grid launch-city-grid">
          {visibleCities.map((guide, index) => (
            <Link className={`city-card city-card-${index % 5}`} href={`/city/${guide.slug}`} key={guide.slug} aria-label={`打开${guide.city}旅行攻略`}>
              <Image src={guide.image} alt={guide.imageAlt} fill sizes="(max-width: 760px) 100vw, 33vw" />
              <div className="city-shade" />
              <div className="city-card-top"><span>{guide.province} · 已完成编辑</span><span>{guide.defaultDays}日标准方案</span></div>
              <div className="city-card-main">
                <h3>{guide.city}</h3>
                <p>{guide.intro}</p>
                <div>{guide.themes.slice(0, 3).map((item) => <span key={item.title}>{item.title.replace(guide.city, "这座城")}</span>)}</div>
                <strong>打开 {guide.city} 攻略 <span>↗</span></strong>
              </div>
            </Link>
          ))}
        </div>
        {!visibleCities.length && <div className="empty-state">这三个已完成城市中没有匹配内容。可以先搜索“美食”“博物馆”或“少折返”。</div>}
      </section>

      <section className="home-boundary">
        <p>当前优先开放杭州、成都、北京三个完整示范。城市内容完成编辑与核验后才会进入首页，不用空壳数量制造“全国覆盖”的错觉。</p>
      </section>

      <footer>
        <Link className="brand" href="/"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></Link>
        <p>中国城市实用旅行攻略 · 路线、餐厅与取舍一次整理清楚</p><small>© 2026 旅策</small>
      </footer>
    </main>
  );
}
