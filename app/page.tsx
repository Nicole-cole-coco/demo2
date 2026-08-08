"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CITY_PROFILES, DEMO_PLAN, citySearchTerms, findCityProfile, type CityProfile } from "@/lib/cities";
import { formatChinaDate } from "@/lib/date-format";
import { canShowBookingInfo, canShowOpeningInfo, canShowTicketPrice, isSpecificEvidenceSource, publicFacingText } from "@/lib/public-trip";
import type { TravelPlan } from "@/lib/deepseek";

const REGIONS = ["全部", "华北", "东北", "华东", "华中", "华南", "西南", "西北", "港澳台"] as const;
const INTERESTS = ["地道美食", "历史古迹", "山水自然", "城市夜景", "博物馆", "轻徒步", "摄影", "街区漫游"];
const PROGRESS = ["梳理城市代表体验", "核对营业与预约信息", "按片区组织少折返动线", "生成预算与日程"];

function isRenderableTravelPlan(value: unknown): value is TravelPlan {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TravelPlan>;

  return typeof candidate.destination === "string"
    && Boolean(findCityProfile(candidate.destination))
    && typeof candidate.title === "string"
    && typeof candidate.heroSummary === "string"
    && Array.isArray(candidate.bestFor)
    && Array.isArray(candidate.highlights)
    && Array.isArray(candidate.foods)
    && Array.isArray(candidate.staySuggestions)
    && Array.isArray(candidate.transportPlan)
    && Array.isArray(candidate.budgetBreakdown)
    && Array.isArray(candidate.days)
    && candidate.days.length > 0
    && candidate.days.every((day) => Array.isArray(day?.stops))
    && (!candidate.liveData || Array.isArray(candidate.liveData.sources));
}

function normalizePlanForPublicPage(plan: TravelPlan): TravelPlan {
  return {
    ...plan,
    subtitle: publicFacingText(plan.subtitle),
    heroSummary: publicFacingText(plan.heroSummary),
    estimatedDailyBudget: publicFacingText(plan.estimatedDailyBudget),
    estimatedTotalBudget: publicFacingText(plan.estimatedTotalBudget),
    transportSummary: publicFacingText(plan.transportSummary),
    matchReason: publicFacingText(plan.matchReason),
    lodgingAdvice: plan.lodgingAdvice ? publicFacingText(plan.lodgingAdvice) : undefined,
    highlights: plan.highlights.map((item) => ({
      ...item,
      area: item.area
        || plan.days.find((day) => day.stops.some((stop) => stop.title === item.name))?.area
        || plan.staySuggestions[0]?.area,
      why: publicFacingText(item.why),
      pitfall: item.pitfall ? publicFacingText(item.pitfall) : undefined,
    })),
    foods: plan.foods.map((item) => ({ ...item, note: publicFacingText(item.note) })),
    restaurants: plan.restaurants?.map((item) => ({ ...item, why: publicFacingText(item.why) })),
    staySuggestions: plan.staySuggestions.map((item) => ({ ...item, why: publicFacingText(item.why) })),
    transportPlan: plan.transportPlan.map((item) => ({ ...item, detail: publicFacingText(item.detail) })),
    budgetBreakdown: plan.budgetBreakdown.map((item) => ({
      ...item,
      category: publicFacingText(item.category),
      amount: publicFacingText(item.amount),
    })),
    days: plan.days.map((day) => ({
      ...day,
      note: publicFacingText(day.note),
      transportAdvice: publicFacingText(day.transportAdvice),
      arrangementReason: day.arrangementReason ? publicFacingText(day.arrangementReason) : undefined,
      optionalToDrop: day.optionalToDrop ? publicFacingText(day.optionalToDrop) : undefined,
      stops: day.stops.map((stop) => ({
        ...stop,
        detail: publicFacingText(stop.detail),
        source: stop.source ? publicFacingText(stop.source) : undefined,
      })),
    })),
    preDepartureChecklist: plan.preDepartureChecklist?.map(publicFacingText),
    liveData: plan.liveData ? {
      ...plan.liveData,
      sources: plan.liveData.sources.map((source) => ({ ...source, snippet: publicFacingText(source.snippet) })),
    } : undefined,
  };
}

function HighlightCard({ item }: { item: TravelPlan["highlights"][number] }) {
  const showTicket = canShowTicketPrice(item);
  const showOpening = canShowOpeningInfo(item);
  const showBooking = canShowBookingInfo(item);
  const showFacts = showTicket || showOpening || showBooking;

  return (
    <article>
      <div><span>{item.type}</span><em>{item.area ?? "城市代表体验"}</em></div>
      <h3>{item.name}</h3>
      <p>{item.why}</p>
      {showFacts && <dl className="highlight-facts">
        {showTicket && <div className="ticket-fact"><dt>门票参考</dt><dd><b>{item.ticketReference}</b><a href={item.ticketSource?.url} target="_blank" rel="noreferrer">{item.ticketSource?.official ? "官方公开信息" : "可靠资料"} · 更新于{formatChinaDate(item.ticketCheckedAt)} ↗</a></dd></div>}
        {showOpening && <div><dt>开放时间</dt><dd>{item.openingHours}<a href={item.openingSource?.url} target="_blank" rel="noreferrer">核验于{formatChinaDate(item.openingCheckedAt)} ↗</a></dd></div>}
        {showBooking && <div><dt>预约提示</dt><dd>{item.bookingNote}<a href={item.bookingSource?.url} target="_blank" rel="noreferrer">查看具体说明 · {formatChinaDate(item.bookingCheckedAt)} ↗</a></dd></div>}
      </dl>}
      <div className="highlight-guide"><p><span>建议时长</span>{item.duration}</p>{item.bestTime && <p><span>适合时间</span>{item.bestTime}</p>}<p><span>所在片区</span>{item.area ?? "按当日主片区安排"}</p></div>
      {item.pitfall && <p className="pitfall"><span>避坑</span>{item.pitfall}</p>}
    </article>
  );
}

function sourcesForPlan(plan: TravelPlan) {
  const candidates = [
    ...(plan.liveData?.sources ?? []),
    ...plan.highlights.flatMap((item) => [item.ticketSource, item.openingSource, item.bookingSource]),
    ...(plan.restaurants ?? []).map((item) => item.source),
  ].filter(isSpecificEvidenceSource);
  return [...new Map(candidates.map((source) => [source!.url, source!])).values()];
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
  const [plan, setPlan] = useState<TravelPlan>(() => normalizePlanForPublicPage(DEMO_PLAN));
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const [toast, setToast] = useState("");
  const plannerRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const resultProfile = findCityProfile(plan.destination);
  const resultImage = resultProfile?.image ?? "/og-v2.png";
  const planSources = sourcesForPlan(plan);
  const verifiedRestaurants = (plan.restaurants ?? []).filter((item) => item.source && item.checkedAt && isSpecificEvidenceSource(item.source));
  const filteredCities = useMemo(() => CITY_PROFILES.filter((city) => {
    const matchesRegion = region === "全部" || city.region === region;
    const keyword = cityQuery.trim().toLowerCase();
    const matchesQuery = !keyword || [...citySearchTerms(city), city.hook, ...city.tags, ...city.foods, ...city.sights]
      .join(" ").toLowerCase().includes(keyword);
    return matchesRegion && matchesQuery;
  }), [region, cityQuery]);

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
          const value: unknown = JSON.parse(savedPlan);
          if (isRenderableTravelPlan(value)) setPlan(normalizePlanForPublicPage(value));
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
      const publicPlan = normalizePlanForPublicPage(payload.plan);
      setPlan(publicPlan);
      setDestination(publicPlan.destination);
      localStorage.setItem("lvce-plan", JSON.stringify(publicPlan));
      setToast(payload.mode === "live" ? "最佳方案已生成：美食、景点、交通和预算均已纳入" : `${payload.plan.destination}攻略已生成；营业与收费信息请在出发前确认`);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch {
      setToast("暂时无法生成新方案，请稍后重试；你仍可浏览当前城市攻略");
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
      </header>

      <section className="hero" id="top">
        <Image className="hero-image" src="/cities/hangzhou.jpg" alt="杭州西湖湖面、游船与山林" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="eyebrow">CHINA CITY TRAVEL PLANNER</p>
          <h1>不是列景点，<br /><em>是选出最适合你的走法。</em></h1>
          <p>只做中国城市。从城市特色出发，把必吃、必看、交通和预算排进同一条顺路行程；重要信息保留核验来源，再按片区组织少折返动线。</p>
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
          <div className="planning-principles"><span><b>01</b> 核对营业与预约信息</span><span><b>02</b> 按片区组织区域动线</span><span><b>03</b> 根据偏好做方案取舍</span><span><b>04</b> 只展示有来源的参考价</span></div>
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
          <div className="result-copy"><span className="result-label">YOUR CITY PLAN</span><h2>{plan.title}</h2><p>{plan.heroSummary}</p><div className="result-tags">{plan.bestFor.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="result-actions"><button type="button" onClick={() => { localStorage.setItem("lvce-plan", JSON.stringify(plan)); setToast("方案已保存在当前浏览器"); }}>♡ 保存</button><button type="button" onClick={sharePlan}>↗ 分享</button></div>
        </div>

        <section className="trip-summary" aria-labelledby="trip-summary-title">
          <div className="budget-brief"><span>TRIP BUDGET</span><b>{plan.estimatedDailyBudget}</b><strong>{plan.estimatedTotalBudget}</strong><small>不含往返大交通，住宿按双人入住分摊估算；动态门票只在有可靠资料时计入每天花费。</small></div>
          <div className="day-summary"><div className="summary-title"><span>01 · ROUTE AT A GLANCE</span><h2 id="trip-summary-title">{plan.days.length}日行程摘要</h2></div><ol>{plan.days.map((day,index) => <li key={day.label}><a href={`#trip-day-${index + 1}`}><span>{day.label}<small>{day.date.split(" · ")[0]}</small></span><b>{day.area}</b><p>{day.theme}</p><em>{day.dailyBudget}</em></a></li>)}</ol></div>
        </section>

        <section className="arrangement-note"><div><span>02 · WHY THIS ROUTE</span><h2>为什么这样安排</h2></div><div className="arrangement-copy"><p>{plan.matchReason}</p>{plan.lodgingAdvice && <p className="lodging-advice">{plan.lodgingAdvice}</p>}<p className="transport-line"><b>全程交通：</b>{plan.transportSummary}</p></div></section>

        <div className="content-heading itinerary-heading"><div><span>03 · DAY BY DAY</span><h2>逐日行程是这份攻略的主体</h2></div><p>每一天先解决去哪里、吃什么、怎么衔接和大约花多少钱。</p></div>
        <div className="day-plans">{plan.days.map((day,dayIndex) => {
          const costItems = day.costItems?.length ? day.costItems : [{ label: "当日合计", amount: day.dailyBudget }];
          return <article className="day-plan" id={`trip-day-${dayIndex + 1}`} key={day.label}>
            <div className="day-plan-head"><div><span>{day.label} · {day.date}</span><h2>{day.theme}</h2><p>{day.note}</p></div><em>{day.area}</em></div>
            <div className="day-route-note"><span>简易衔接</span><p>{day.transportAdvice}</p></div>
            <div className="timeline">{day.stops.map((stop,index) => <div className="timeline-row" key={`${stop.time}-${stop.title}`}><time>{stop.time}</time><div className={`dot ${stop.tone}`}>{index + 1}</div><div className="stop"><div><h3>{stop.title}</h3><span>{stop.meta}</span></div><p>{stop.detail}</p></div></div>)}</div>
            <div className="day-close"><div className="day-cost"><span>{day.label} 参考花费</span><dl>{costItems.map((item) => <div key={`${day.label}-${item.label}`}><dt>{item.label}</dt><dd>{item.amount}</dd></div>)}</dl></div><div className="day-reason"><span>为什么这样安排</span><p>{day.arrangementReason ?? day.note}</p>{day.optionalToDrop && <p className="cancel-note"><b>可以取消：</b>{day.optionalToDrop}</p>}</div></div>
          </article>;
        })}</div>

        <div className="content-heading restaurant-heading"><div><span>04 · LOCAL TABLE</span><h2>标志性餐厅与当地美食</h2></div><p>具体餐厅只在有独立资料页时推荐；否则只给代表菜和合适片区。</p></div>
        {verifiedRestaurants.length > 0 && <div className="restaurant-list">{verifiedRestaurants.map((item,index) => <article key={item.name}><span className="restaurant-index">{String(index + 1).padStart(2,"0")}</span><div className="restaurant-main"><div><em>{item.classicStatus}</em><h3>{item.name}</h3></div><p>{item.why}</p></div><dl><div><dt>招牌菜</dt><dd>{item.signatureDishes.join(" · ")}</dd></div><div><dt>人均参考</dt><dd>{item.budget}</dd></div><div><dt>怎么安排</dt><dd>{item.plannedFor} · {item.area}</dd></div></dl>{item.source && <a href={item.source.url} target="_blank" rel="noreferrer">{item.source.siteName} · 核验于{formatChinaDate(item.checkedAt)} ↗</a>}</article>)}</div>}
        <div className="local-food-list">{verifiedRestaurants.length === 0 && <p className="food-boundary">具体店铺营业状态尚未完成核验，先按代表菜与当天片区选择。</p>}{plan.foods.map((item) => <article key={item.name}><span>{item.category}</span><h3>{item.name}</h3><b>{item.suggestion} · {item.budget}</b><p>{item.note}</p></article>)}</div>

        <div className="content-heading highlight-heading"><div><span>05 · CITY ESSENTIALS</span><h2>真正值得单独介绍的城市精华</h2></div><p>只保留能影响时间选择、片区取舍和现场体验的信息。</p></div>
        <div className="highlight-list">{plan.highlights.map((item) => <HighlightCard item={item} key={item.name} />)}</div>

        <section className="pre-departure"><div><span>06 · BEFORE YOU GO</span><h2>出发前完成</h2></div><ul>{(plan.preDepartureChecklist?.length ? plan.preDepartureChecklist : ["核对计划内场馆预约", "出发前一天查看天气", "节假日提前购买往返车票", "为热门餐厅准备同片区替代方案"]).map((item) => <li key={item}><span aria-hidden="true">□</span>{item}</li>)}</ul></section>

        {planSources.length > 0 && <details className="source-details"><summary>查看本攻略的信息来源 <span>{planSources.length} 条</span></summary><div>{planSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span>{source.category}{source.official ? " · 官方" : ""}</span><b>{source.title}</b><small>{source.siteName} · 查询于{formatChinaDate(source.queriedAt)} ↗</small></a>)}</div></details>}
        <p className="verification-line">营业时间、预约和收费信息可能调整，出发前建议通过对应景区或场馆的官方渠道再次确认。</p>
      </section>

      <section className="final-cta"><div><span>YOUR CITY, YOUR WAY</span><h2>不把城市塞满，<br />只留下真正值得的部分。</h2></div><a href="#planner">重新设置偏好 <span>↗</span></a></section>
      <footer><a className="brand" href="#top"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></a><p>中国城市旅行攻略 · 美食、景点、交通与预算一体规划</p><small>© 2026 旅策</small></footer>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
