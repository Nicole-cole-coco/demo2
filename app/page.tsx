"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CITY_PROFILES, DEMO_PLAN, type CityProfile } from "@/lib/cities";
import type { TravelPlan } from "@/lib/deepseek";

const REGIONS = ["全部", "华北", "华东", "华南", "西南", "西北"] as const;
const INTERESTS = ["地道美食", "历史古迹", "山水自然", "城市夜景", "博物馆", "轻徒步", "摄影", "街区漫游"];
const PROGRESS = ["理解偏好与预算", "筛选城市精华", "组合顺路动线", "核对交通与花费"];

function findCityProfile(city: string) {
  return CITY_PROFILES.find((item) => city.includes(item.city) || item.city.includes(city)) ?? CITY_PROFILES[0];
}

export default function Home() {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("全部");
  const [cityQuery, setCityQuery] = useState("");
  const [destination, setDestination] = useState("杭州");
  const [originCity, setOriginCity] = useState("");
  const [startDate, setStartDate] = useState("2026-10-23");
  const [days, setDays] = useState(4);
  const [pace, setPace] = useState<"松弛" | "舒展" | "充实">("舒展");
  const [budget, setBudget] = useState<"经济" | "适中" | "舒适">("适中");
  const [transport, setTransport] = useState<"公共交通优先" | "打车节省时间" | "自驾周边">("公共交通优先");
  const [interests, setInterests] = useState(["地道美食", "历史古迹", "街区漫游"]);
  const [constraints, setConstraints] = useState("");
  const [plan, setPlan] = useState<TravelPlan>(DEMO_PLAN);
  const [activeDay, setActiveDay] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [toast, setToast] = useState("");
  const plannerRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const resultProfile = findCityProfile(plan.destination);
  const activePlanDay = plan.days[activeDay] ?? plan.days[0];
  const filteredCities = useMemo(() => CITY_PROFILES.filter((city) => {
    const matchesRegion = region === "全部" || city.region === region;
    const keyword = cityQuery.trim().toLowerCase();
    const matchesQuery = !keyword || [city.city, city.province, city.hook, ...city.tags, ...city.foods, ...city.sights]
      .join(" ").toLowerCase().includes(keyword);
    return matchesRegion && matchesQuery;
  }), [region, cityQuery]);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => setAiConfigured(Boolean(data.configured)))
      .catch(() => setAiConfigured(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + 1, PROGRESS.length - 1)), 820);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  function chooseCity(city: CityProfile) {
    setDestination(city.city);
    plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setToast(`已选择 ${city.city}，继续设置偏好与预算`);
  }

  function toggleInterest(item: string) {
    setInterests((current) => current.includes(item)
      ? current.filter((value) => value !== item)
      : current.length < 5 ? [...current, item] : current);
  }

  async function generatePlan(event: FormEvent) {
    event.preventDefault();
    if (!destination.trim()) {
      setToast("请先选择或输入一个中国城市");
      return;
    }
    setProgress(0);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, originCity, startDate, days, pace, budget, interests, transport, constraints }),
      });
      const payload = await response.json() as { plan?: TravelPlan; error?: string; message?: string };
      if (!response.ok || !payload.plan) {
        if (payload.error === "DEEPSEEK_NOT_CONFIGURED") {
          setAiConfigured(false);
          setPlan(DEMO_PLAN);
          setActiveDay(0);
          setToast("当前为演示模式：配置 DeepSeek 后即可按你的偏好生成完整方案");
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        throw new Error(payload.message || "生成失败，请稍后重试");
      }
      setPlan(payload.plan);
      setDestination(payload.plan.destination);
      setActiveDay(0);
      setAiConfigured(true);
      setToast("最佳方案已生成：美食、景点、交通和预算均已纳入");
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  }

  async function sharePlan() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("网站地址已复制，可直接分享给同行人");
    } catch {
      setToast("请复制浏览器地址分享");
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="旅策首页"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></a>
        <nav aria-label="主导航"><a href="#cities">选城市</a><a href="#planner">定偏好</a><a href="#result">看方案</a></nav>
        <div className={`api-badge ${aiConfigured ? "connected" : ""}`}><i />{aiConfigured === null ? "检查接口" : aiConfigured ? "DeepSeek 已连接" : "演示模式"}</div>
      </header>

      <section className="hero" id="top">
        <Image className="hero-image" src="/cities/hangzhou.jpg" alt="杭州西湖湖面、游船与山林" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="eyebrow">CHINA CITY TRAVEL PLANNER</p>
          <h1>不是列景点，<br /><em>是选出最适合你的走法。</em></h1>
          <p>从城市特色出发，把必吃、必看、交通和预算排进同一条顺路行程。只做中国城市，给出有取舍的最佳方案。</p>
          <div className="hero-actions"><a href="#planner" className="primary">生成最佳方案 <span>↗</span></a><a href="#cities" className="ghost">先找灵感</a></div>
        </div>
        <div className="hero-insight">
          <span>本周灵感 · 杭州</span>
          <h2>湖山与茶香之间，<br />给行程留一点呼吸。</h2>
          <div><b>3–5 天</b><b>¥450–850 / 人日</b><b>山水 · 人文</b></div>
        </div>
      </section>

      <section className="city-section" id="cities">
        <div className="section-title">
          <div><p className="eyebrow dark">CITY COLLECTION</p><h2>先看城市最值得体验什么</h2><p>不是同一套模板换城市名。每座城市都先呈现地域特色、代表味道和真实交通逻辑。</p></div>
          <label className="city-search"><span>⌕</span><input value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="搜索城市、美食或体验" /></label>
        </div>
        <div className="region-tabs" role="tablist" aria-label="按区域筛选城市">
          {REGIONS.map((item) => <button key={item} type="button" className={region === item ? "active" : ""} onClick={() => setRegion(item)}>{item}</button>)}
        </div>
        <div className="city-grid">
          {filteredCities.map((city, index) => (
            <article className={`city-card city-card-${index % 5}`} key={city.city}>
              <Image src={city.image} alt={`${city.city}代表性城市风景`} fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 33vw, 25vw" />
              <div className="city-shade" />
              <div className="city-card-top"><span>{city.region} · {city.province}</span><span>{city.idealDays}</span></div>
              <div className="city-card-main"><h3>{city.city}</h3><p>{city.hook}</p><div>{city.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              <div className="city-card-detail">
                <p><span>吃什么</span><b>{city.foods.join(" · ")}</b></p>
                <p><span>看什么</span><b>{city.sights.join(" · ")}</b></p>
                <p><span>预算</span><b>{city.dailyBudget}</b></p>
                <button type="button" onClick={() => chooseCity(city)}>用 {city.city} 生成方案 <span>↗</span></button>
              </div>
            </article>
          ))}
        </div>
        {!filteredCities.length && <div className="empty-state">没有找到匹配城市，试试搜索“美食”“山水”或切换区域。</div>}
      </section>

      <section className="planner-section" id="planner" ref={plannerRef}>
        <div className="planner-intro">
          <p className="eyebrow dark">BUILD YOUR BEST ROUTE</p>
          <h2>只问真正影响方案的事</h2>
          <p>不再统计无意义的人数。城市、天数、预算、节奏、交通方式与兴趣，才决定景点取舍和每天怎么走。</p>
          <div className="planning-principles"><span><b>01</b> 城市特色优先</span><span><b>02</b> 预算决定取舍</span><span><b>03</b> 动线减少折返</span></div>
        </div>
        <form className="planner" onSubmit={generatePlan}>
          <div className="form-row two">
            <label><span>从哪里出发 <small>用于判断大交通</small></span><input value={originCity} onChange={(event) => setOriginCity(event.target.value)} placeholder="例如：上海" /></label>
            <label><span>想去哪个中国城市</span><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="例如：泉州" required /></label>
          </div>
          <div className="form-row three">
            <label><span>出发日期</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label><span>旅行天数</span><select value={days} onChange={(event) => setDays(Number(event.target.value))}>{[2,3,4,5,6,7,8].map((item) => <option value={item} key={item}>{item} 天</option>)}</select></label>
            <label><span>城市内怎么走</span><select value={transport} onChange={(event) => setTransport(event.target.value as typeof transport)}><option>公共交通优先</option><option>打车节省时间</option><option>自驾周边</option></select></label>
          </div>
          <div className="choice-columns">
            <fieldset><legend>每天想安排多满？</legend><div className="segmented">{(["松弛","舒展","充实"] as const).map((item) => <button type="button" key={item} className={pace === item ? "active" : ""} onClick={() => setPace(item)}>{item}<small>{{松弛:"2–3处",舒展:"3–4处",充实:"4–5处"}[item]}</small></button>)}</div></fieldset>
            <fieldset><legend>人均预算水平</legend><div className="segmented">{(["经济","适中","舒适"] as const).map((item) => <button type="button" key={item} className={budget === item ? "active" : ""} onClick={() => setBudget(item)}>{item}<small>{{经济:"控制花费",适中:"体验均衡",舒适:"时间优先"}[item]}</small></button>)}</div></fieldset>
          </div>
          <fieldset className="interest-box"><legend>这次最想得到什么？ <small>最多 5 项</small></legend><div>{INTERESTS.map((item) => <button type="button" key={item} className={interests.includes(item) ? "active" : ""} onClick={() => toggleInterest(item)}><span>{interests.includes(item) ? "✓" : "+"}</span>{item}</button>)}</div></fieldset>
          <label className="constraints"><span>还有什么必须照顾？ <small>选填</small></span><textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} maxLength={300} placeholder="例如：不吃辣、避免排队、每天午后留一小时休息、必须安排当地菜市场……" /></label>
          <div className="planner-submit">
            <div><span>将为你重点比较</span><p>{interests.slice(0,3).join("、")} · {budget}预算 · {transport}</p></div>
            <button type="submit" disabled={isGenerating}>{isGenerating ? "正在生成最佳方案" : `生成 ${destination || "这座城市"} 最佳方案`} <span>✦</span></button>
          </div>
          {isGenerating && <div className="generation"><div className="generation-mark">旅<i /></div><p>正在为 {destination} 做取舍</p><h3>{PROGRESS[progress]}</h3><div className="progress"><span style={{width:`${(progress + 1) * 25}%`}} /></div><div className="progress-labels">{PROGRESS.map((item,index) => <span className={index <= progress ? "done" : ""} key={item}>{index < progress ? "✓" : index + 1} {item}</span>)}</div></div>}
        </form>
      </section>

      <section className="result-section" id="result" ref={resultRef}>
        <div className="result-hero">
          <Image src={resultProfile.image} alt={`${plan.destination}旅行方案封面`} fill sizes="100vw" />
          <div className="result-shade" />
          <div className="result-copy"><span className="result-label">{aiConfigured ? "DEEPSEEK BEST MATCH" : "COMPLETE DEMO PLAN"}</span><h2>{plan.title}</h2><p>{plan.heroSummary}</p><div className="result-tags">{plan.bestFor.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="result-actions"><button type="button" onClick={() => { localStorage.setItem("lvce-plan", JSON.stringify(plan)); setToast("方案已保存在当前浏览器"); }}>♡ 保存</button><button type="button" onClick={sharePlan}>↗ 分享</button></div>
        </div>

        <div className="result-metrics">
          <div><span>预算建议</span><b>{plan.estimatedTotalBudget}</b><small>{plan.estimatedDailyBudget}</small></div>
          <div><span>城市交通</span><b>{plan.transportSummary}</b><small>按区域安排，减少折返</small></div>
          <div className="match-metric"><span>为什么推荐</span><p>{plan.matchReason}</p></div>
        </div>

        <div className="content-heading"><div><span>01 · CITY ESSENTIALS</span><h2>最值得放进行程的城市精华</h2></div><p>每一项都说明“为什么值得”，而不是只给名字。</p></div>
        <div className="highlight-grid">{plan.highlights.map((item,index) => <article key={item.name}><div><span>{String(index + 1).padStart(2,"0")}</span><em>{item.type}</em></div><h3>{item.name}</h3><p>{item.why}</p><small>建议安排 {item.duration}</small></article>)}</div>

        <div className="content-heading food-heading"><div><span>02 · LOCAL FLAVOURS</span><h2>把特色美食安排到正确的一餐</h2></div><p>不单列网红店，重点告诉你吃什么、何时吃、预算多少。</p></div>
        <div className="food-grid">{plan.foods.map((item,index) => <article key={item.name}><div className="food-number">{String(index + 1).padStart(2,"0")}</div><span>{item.category}</span><h3>{item.name}</h3><b>{item.suggestion} · {item.budget}</b><p>{item.note}</p></article>)}</div>

        <div className="logistics-grid">
          <article className="transport-card"><div className="block-kicker"><span>03 · GETTING AROUND</span><h2>交通不是备注，是路线骨架</h2></div>{plan.transportPlan.map((item,index) => <div className="transport-row" key={item.scene}><span>{index + 1}</span><div><small>{item.scene}</small><h3>{item.choice}</h3><p>{item.detail}</p></div></div>)}</article>
          <article className="budget-card"><div className="block-kicker"><span>04 · BUDGET</span><h2>钱主要花在哪里</h2></div><div className="budget-total"><span>人均全程参考</span><b>{plan.estimatedTotalBudget}</b><small>动态价格出发前复核</small></div><div className="budget-list">{plan.budgetBreakdown.map((item) => <div key={item.category}><p><span>{item.category}</span><b>{item.amount}</b></p><div><i style={{width:`${Math.min(item.percent,100)}%`}} /></div><small>{item.percent}%</small></div>)}</div></article>
        </div>

        <div className="content-heading itinerary-heading"><div><span>05 · DAY BY DAY</span><h2>每天一条主线，吃与玩一起排</h2></div><p>行程按区域组织，保留休息和临场调整空间。</p></div>
        <div className="day-tabs" role="tablist" aria-label="选择行程日期">{plan.days.map((day,index) => <button type="button" role="tab" aria-selected={activeDay === index} className={activeDay === index ? "active" : ""} key={day.label} onClick={() => setActiveDay(index)}><span>{day.label}</span><b>{day.date.split(" · ")[0]}</b><small>{day.theme.split(" · ")[0]}</small></button>)}</div>
        {activePlanDay && <article className="day-plan"><div className="day-plan-head"><div><span>{activePlanDay.label} · {activePlanDay.date}</span><h2>{activePlanDay.theme}</h2><p>{activePlanDay.note}</p></div><button type="button" onClick={() => setToast("配置 DeepSeek 后，可按新偏好重新生成局部行程")}>调整这一天</button></div><div className="timeline">{activePlanDay.stops.map((stop,index) => <div className="timeline-row" key={`${stop.time}-${stop.title}`}><time>{stop.time}</time><div className={`dot ${stop.tone}`}>{index + 1}</div><div className="stop"><div><h3>{stop.title}</h3><span>{stop.meta}</span></div><p>{stop.detail}</p>{stop.source && <small>◇ {stop.source}</small>}</div></div>)}</div></article>}

        <div className="verification"><span>信息边界</span><p>{plan.verificationNote}</p><b>AI 负责生成最佳结构；天气、票务、营业时间与交通管制应接入专业数据 API 或在出发前通过官方渠道复核。</b></div>
      </section>

      <section className="final-cta"><div><span>YOUR CITY, YOUR WAY</span><h2>不把城市塞满，<br />只留下真正值得的部分。</h2></div><a href="#planner">重新设置偏好 <span>↗</span></a></section>
      <footer><a className="brand" href="#top"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></a><p>中国城市旅行攻略 · 美食、景点、交通与预算一体规划</p><small>© 2026 旅策</small></footer>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
