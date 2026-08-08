"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CITY_PROFILES, DEMO_PLAN, citySearchTerms, findCityProfile, type CityProfile } from "@/lib/cities";
import type { TravelPlan } from "@/lib/deepseek";

const REGIONS = ["全部", "华北", "东北", "华东", "华中", "华南", "西南", "西北", "港澳台"] as const;
const INTERESTS = ["地道美食", "历史古迹", "山水自然", "城市夜景", "博物馆", "轻徒步", "摄影", "街区漫游"];
const PROGRESS = ["联网检索城市资料", "核对门票与开放时间", "计算景点间路线", "生成预算与日程"];

type DataStatus = {
  searchConfigured: boolean;
  mapConfigured: boolean;
  searchProvider: string;
  mapProvider: string;
};

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
  const [generationMode, setGenerationMode] = useState<"live" | "demo">("demo");
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [toast, setToast] = useState("");
  const plannerRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const resultProfile = findCityProfile(plan.destination);
  const resultImage = resultProfile?.image ?? "/og-v2.png";
  const activePlanDay = plan.days[activeDay] ?? plan.days[0];
  const filteredCities = useMemo(() => CITY_PROFILES.filter((city) => {
    const matchesRegion = region === "全部" || city.region === region;
    const keyword = cityQuery.trim().toLowerCase();
    const matchesQuery = !keyword || [...citySearchTerms(city), city.hook, ...city.tags, ...city.foods, ...city.sights]
      .join(" ").toLowerCase().includes(keyword);
    return matchesRegion && matchesQuery;
  }), [region, cityQuery]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/status").then((response) => response.json() as Promise<{ configured?: boolean }>),
      fetch("/api/data/status").then((response) => response.json() as Promise<DataStatus>),
    ])
      .then(([ai, data]) => {
        setAiConfigured(Boolean(ai.configured));
        setDataStatus(data);
      })
      .catch(() => {
        setAiConfigured(false);
        setDataStatus({ searchConfigured: false, mapConfigured: false, searchProvider: "demo", mapProvider: "demo" });
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedForm = localStorage.getItem("lvce-form");
        const savedPlan = localStorage.getItem("lvce-plan");
        if (savedForm) {
          const value = JSON.parse(savedForm) as Partial<{ destination: string; originCity: string; startDate: string; days: number; pace: typeof pace; budget: typeof budget; transport: typeof transport; interests: string[]; constraints: string }>;
          if (value.destination && findCityProfile(value.destination)) setDestination(value.destination);
          if (typeof value.originCity === "string") setOriginCity(value.originCity);
          if (typeof value.startDate === "string") setStartDate(value.startDate);
          if (typeof value.days === "number" && value.days >= 2 && value.days <= 8) setDays(value.days);
          if (value.pace) setPace(value.pace);
          if (value.budget) setBudget(value.budget);
          if (value.transport) setTransport(value.transport);
          if (Array.isArray(value.interests)) setInterests(value.interests.slice(0, 5));
          if (typeof value.constraints === "string") setConstraints(value.constraints);
        }
        if (savedPlan) {
          const value = JSON.parse(savedPlan) as TravelPlan;
          if (value?.destination && findCityProfile(value.destination) && Array.isArray(value.days)) setPlan(value);
        }
      } catch { /* 损坏的本地草稿不应阻止匿名访问 */ }
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("lvce-form", JSON.stringify({ destination, originCity, startDate, days, pace, budget, transport, interests, constraints }));
  }, [storageReady, destination, originCity, startDate, days, pace, budget, transport, interests, constraints]);

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
    const selectedProfile = findCityProfile(destination);
    if (!selectedProfile) {
      setToast("旅策目前只服务已完成内容核验的中国城市；该目的地暂不支持");
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
      const payload = await response.json() as { plan?: TravelPlan; error?: string; message?: string; provider?: string; mode?: "live" | "demo" };
      if (!response.ok || !payload.plan) {
        throw new Error(payload.message || "生成失败，请稍后重试");
      }
      setPlan(payload.plan);
      setDestination(payload.plan.destination);
      setActiveDay(0);
      const mode = payload.mode === "live" ? "live" : "demo";
      setGenerationMode(mode);
      setAiConfigured(mode === "live");
      localStorage.setItem("lvce-plan", JSON.stringify(payload.plan));
      setToast(mode === "live" ? "最佳方案已生成：美食、景点、交通和预算均已纳入" : `${payload.plan.destination}基础方案已生成；动态信息均明确标记待核验`);
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
        <div className="api-stack" aria-label="数据服务状态">
          <div className={`api-badge ${aiConfigured ? "connected" : ""}`}><i />{aiConfigured === null ? "检查接口" : aiConfigured ? "AI 已连接" : "演示模式"}</div>
          <div className={`api-badge ${dataStatus?.searchConfigured ? "connected" : ""}`} title={`搜索服务：${dataStatus?.searchProvider ?? "检查中"}`}><i />{dataStatus?.searchConfigured ? "联网搜索" : "搜索待接入"}</div>
          <div className={`api-badge ${dataStatus?.mapConfigured ? "connected" : ""}`} title={`地图服务：${dataStatus?.mapProvider ?? "检查中"}`}><i />{dataStatus?.mapConfigured ? "路线已连接" : "路线待接入"}</div>
        </div>
      </header>

      <section className="hero" id="top">
        <Image className="hero-image" src="/cities/hangzhou.jpg" alt="杭州西湖湖面、游船与山林" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="eyebrow">CHINA CITY TRAVEL PLANNER</p>
          <h1>不是列景点，<br /><em>是选出最适合你的走法。</em></h1>
          <p>只做中国城市。从城市特色出发，把必吃、必看、交通和预算排进同一条顺路行程；联网检索门票、开放时间与官方提示，再用地图接口计算顺路动线。</p>
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
          <div><p className="eyebrow dark">CITY COLLECTION · {CITY_PROFILES.length} CITIES</p><h2>先看城市最值得体验什么</h2><p>不是同一套模板换城市名。每座城市都先呈现地域特色、代表味道和真实交通逻辑。</p></div>
          <label className="city-search"><span>⌕</span><input value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="搜索城市、拼音、古称、美食或体验" /></label>
        </div>
        <div className="region-tabs" role="tablist" aria-label="按区域筛选城市">
          {REGIONS.map((item) => <button key={item} type="button" className={region === item ? "active" : ""} onClick={() => setRegion(item)}>{item}</button>)}
        </div>
        <div className="city-grid">
          {filteredCities.map((city, index) => (
            <article className={`city-card city-card-${index % 5}`} key={city.city}>
              <Image src={city.image} alt={`${city.city}${city.sights[0]}等代表性地域景观`} fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 33vw, 25vw" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
              <div className="city-shade" />
              <div className="city-card-top"><span>{city.region} · {city.province}</span><span>{city.idealDays}</span></div>
              <div className="city-card-main"><h3>{city.city}</h3><p>{city.hook}</p><div>{city.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button className="city-quick-select" type="button" onClick={() => chooseCity(city)}>选择 {city.city} ↗</button></div>
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
          <p>不再统计无意义的人数。城市、天数、预算、节奏、交通方式与兴趣，才决定景点取舍和每天怎么走。联网结果保留来源与查询时间，未核验的信息会明确标注。</p>
          <div className="planning-principles"><span><b>01</b> 联网查门票与开放时间</span><span><b>02</b> 地图计算相邻路线</span><span><b>03</b> DeepSeek 做方案取舍</span><span><b>04</b> 只展示参考价，不冒充成交价</span></div>
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
          <Image src={resultImage} alt={`${plan.destination}${resultProfile?.sights[0] ?? "城市"}旅行方案封面`} fill sizes="100vw" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
          <div className="result-shade" />
          <div className="result-copy"><span className="result-label">{generationMode === "live" ? "DEEPSEEK BEST MATCH" : "CITY DATA · DEMO MODE"}</span><h2>{plan.title}</h2><p>{plan.heroSummary}</p><div className="result-tags">{plan.bestFor.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="result-actions"><button type="button" onClick={() => { localStorage.setItem("lvce-plan", JSON.stringify(plan)); setToast("方案已保存在当前浏览器"); }}>♡ 保存</button><button type="button" onClick={sharePlan}>↗ 分享</button></div>
        </div>

        <div className="result-metrics">
          <div><span>预算建议</span><b>{plan.estimatedTotalBudget}</b><small>{plan.estimatedDailyBudget}</small></div>
          <div><span>城市交通</span><b>{plan.transportSummary}</b><small>按区域安排，减少折返</small></div>
          <div className="match-metric"><span>为什么推荐</span><p>{plan.matchReason}</p></div>
        </div>

        <div className="live-data-strip">
          <div><span className={plan.liveData?.searchStatus === "live" ? "status-dot live" : "status-dot"} /><p>联网资料 · {plan.liveData?.searchProvider ?? "未配置"}</p><b>{plan.liveData?.searchStatus === "live" ? `${plan.liveData.sources.length} 条来源` : plan.liveData?.searchStatus === "partial" ? "部分资料不可用" : "等待搜索 API"}</b></div>
          <div><span className={plan.liveData?.mapStatus === "live" ? "status-dot live" : "status-dot"} /><p>路线计算 · {plan.liveData?.mapProvider ?? "未配置"}</p><b>{plan.liveData?.mapStatus === "live" ? `${plan.liveData.routeCount} 段已计算` : plan.liveData?.mapStatus === "partial" ? "部分路线未匹配" : "路线 API 待接入"}</b></div>
          <div><p>价格口径</p><b>{plan.liveData?.searchStatus === "live" ? "联网参考价 · 非成交价" : "待核验 · 非实时价"}</b><small>{plan.liveData?.searchedAt ? `${plan.liveData.searchStatus === "live" ? "查询" : "方案生成"}于 ${new Date(plan.liveData.searchedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : "动态信息出发前复核"}</small></div>
          <div><p>成本控制</p><b>缓存 24 小时 · 限制调用量</b><small>优先使用免费配额</small></div>
        </div>

        <div className="content-heading"><div><span>01 · CITY ESSENTIALS</span><h2>最值得放进行程的城市精华</h2></div><p>每一项都说明“为什么值得”，而不是只给名字。</p></div>
        <div className="highlight-grid">{plan.highlights.map((item,index) => <article key={item.name}><div><span>{String(index + 1).padStart(2,"0")}</span><em>{item.type}</em></div><h3>{item.name}</h3><p>{item.why}</p><dl className="highlight-facts"><div><dt>门票</dt><dd>{item.ticketReference || "待核验"}</dd></div><div><dt>开放</dt><dd>{item.openingHours || "待核验"}</dd></div><div><dt>预约</dt><dd>{item.bookingNote || "出发前核验"}</dd></div></dl><small>建议安排 {item.duration} · {item.priceType || "待核验"}</small></article>)}</div>

        <div className="content-heading food-heading"><div><span>02 · LOCAL FLAVOURS</span><h2>把特色美食安排到正确的一餐</h2></div><p>不单列网红店，重点告诉你吃什么、何时吃、预算多少。</p></div>
        <div className="food-grid">{plan.foods.map((item,index) => <article key={item.name}><div className="food-number">{String(index + 1).padStart(2,"0")}</div><span>{item.category}</span><h3>{item.name}</h3><b>{item.suggestion} · {item.budget}</b><p>{item.note}</p></article>)}</div>

        <div className="logistics-grid">
          <article className="transport-card"><div className="block-kicker"><span>03 · GETTING AROUND</span><h2>交通不是备注，是路线骨架</h2></div>{plan.transportPlan.map((item,index) => <div className="transport-row" key={item.scene}><span>{index + 1}</span><div><small>{item.scene}</small><h3>{item.choice}</h3><p>{item.detail}</p></div></div>)}</article>
          <article className="budget-card"><div className="block-kicker"><span>04 · BUDGET</span><h2>钱主要花在哪里</h2></div><div className="budget-total"><span>人均全程参考</span><b>{plan.estimatedTotalBudget}</b><small>动态价格出发前复核</small></div><div className="budget-list">{plan.budgetBreakdown.map((item) => <div key={item.category}><p><span>{item.category}</span><b>{item.amount}</b></p><div><i style={{width:`${Math.min(item.percent,100)}%`}} /></div><small>{item.percent}%</small></div>)}</div></article>
        </div>

        <div className="content-heading itinerary-heading"><div><span>05 · DAY BY DAY</span><h2>每天一条主线，吃与玩一起排</h2></div><p>行程按区域组织，保留休息和临场调整空间。</p></div>
        <div className="day-tabs" role="tablist" aria-label="选择行程日期">{plan.days.map((day,index) => <button type="button" role="tab" aria-selected={activeDay === index} className={activeDay === index ? "active" : ""} key={day.label} onClick={() => setActiveDay(index)}><span>{day.label}</span><b>{day.date.split(" · ")[0]}</b><small>{day.theme.split(" · ")[0]}</small></button>)}</div>
        {activePlanDay && <article className="day-plan"><div className="day-plan-head"><div><span>{activePlanDay.label} · {activePlanDay.date}</span><h2>{activePlanDay.theme}</h2><p>{activePlanDay.note}</p></div><button type="button" onClick={() => setToast("修改偏好后，可重新联网生成完整方案")}>调整方案</button></div><div className="timeline">{activePlanDay.stops.map((stop,index) => <div className="timeline-row" key={`${stop.time}-${stop.title}`}><time>{stop.time}</time><div className={`dot ${stop.tone}`}>{index + 1}</div><div className="stop"><div><h3>{stop.title}</h3><span>{stop.meta}</span></div><p>{stop.detail}</p>{stop.source && <small>◇ {stop.source}</small>}{stop.routeToNext && <div className="route-to-next"><span>下一程 · {stop.routeToNext.mode}</span><b>{stop.routeToNext.duration}</b><em>{stop.routeToNext.distance}{stop.routeToNext.cost ? ` · ${stop.routeToNext.cost}` : ""}</em><small>高德地图参考</small></div>}</div></div>)}</div></article>}

        {plan.liveData?.sources && plan.liveData.sources.length > 0 && <>
          <div className="content-heading source-heading"><div><span>06 · LIVE SOURCES</span><h2>本次方案参考了哪些联网资料</h2></div><p>来源经过整理后展示，不堆砌原始网址；点击可前往原页面核验。</p></div>
          <div className="source-grid">{plan.liveData.sources.slice(0, 12).map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><div><span>{source.category}</span>{source.official && <em>官方来源</em>}<em>{source.confidence ? `${source.confidence}可信` : "可信度待确认"}</em></div><h3>{source.title}</h3><p>{source.snippet || "打开来源查看详细信息"}</p><footer><b>{source.siteName} · {source.priceType || "非价格信息"}</b><span>{source.queriedAt ? `${new Date(source.queriedAt).toLocaleDateString("zh-CN")} ` : ""}核验 ↗</span></footer></a>)}</div>
        </>}

        <div className="verification"><span>信息边界</span><p>{plan.verificationNote}</p><b>{plan.liveData?.searchStatus === "live" ? "已联网检索公开资料，但搜索价格仍是参考价；余票、库存、临时闭馆和最终支付金额以官方页面为准。" : "当前未接入搜索 API，AI 不会把知识库内容冒充实时信息。接入后将自动展示来源和查询时间。"}</b></div>
      </section>

      <section className="final-cta"><div><span>YOUR CITY, YOUR WAY</span><h2>不把城市塞满，<br />只留下真正值得的部分。</h2></div><a href="#planner">重新设置偏好 <span>↗</span></a></section>
      <footer><a className="brand" href="#top"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></a><p>中国城市旅行攻略 · 美食、景点、交通与预算一体规划</p><small>© 2026 旅策</small></footer>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
