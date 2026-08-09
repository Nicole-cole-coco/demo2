"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatChinaDate } from "@/lib/date-format";
import { TRAVEL_INTERESTS, getSource, type EditorialCityGuide, type GuideSource } from "@/lib/editorial-city-guides";

function SourceMark({ source, label }: { source?: GuideSource; label?: string }) {
  if (!source) return null;
  return <a className="fact-source" href={source.url} target="_blank" rel="noreferrer">{label ?? (source.official ? "官方事实" : "资料已核验")} · {formatChinaDate(source.checkedAt)} ↗</a>;
}

export default function CityGuideView({ guide }: { guide: EditorialCityGuide }) {
  const [guideType, setGuideType] = useState("第一次经典路线");
  const [days, setDays] = useState(guide.defaultDays);
  const [startDate, setStartDate] = useState("2026-10-23");
  const [pace, setPace] = useState<"松弛" | "舒展" | "充实">("舒展");
  const [interests, setInterests] = useState<string[]>(["第一次必去", "地道美食", "少折返"]);
  const [mustHave, setMustHave] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const routeRef = useRef<HTMLElement>(null);

  const routeOption = useMemo(() => guide.routeOptions.find((option) => option.days === days) ?? guide.routeOptions.at(-1)!, [days, guide.routeOptions]);
  const displayedDays = routeOption.dayIndexes.map((index) => guide.days[index]).filter(Boolean);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(`lvce-city-form-${guide.slug}`);
        if (saved) {
          const value = JSON.parse(saved) as Partial<{ guideType: string; days: number; startDate: string; pace: typeof pace; interests: string[]; mustHave: string; budgetLimit: string }>;
          if (value.guideType && guide.guideTypes.includes(value.guideType)) setGuideType(value.guideType);
          if (typeof value.days === "number" && guide.routeOptions.some((option) => option.days === value.days)) setDays(value.days);
          if (typeof value.startDate === "string") setStartDate(value.startDate);
          if (value.pace) setPace(value.pace);
          if (Array.isArray(value.interests)) setInterests(value.interests.slice(0, 5));
          if (typeof value.mustHave === "string") setMustHave(value.mustHave);
          if (typeof value.budgetLimit === "string") setBudgetLimit(value.budgetLimit);
        }
      } catch { /* 损坏的本地偏好不阻止城市页显示 */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [guide.guideTypes, guide.routeOptions, guide.slug]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(`lvce-city-form-${guide.slug}`, JSON.stringify({ guideType, days, startDate, pace, interests, mustHave, budgetLimit }));
  }, [budgetLimit, days, guide.slug, guideType, interests, mustHave, pace, ready, startDate]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function toggleInterest(item: string) {
    setInterests((current) => current.includes(item)
      ? current.filter((value) => value !== item)
      : current.length < 5 ? [...current, item] : current);
  }

  function chooseGuideType(type: string) {
    setGuideType(type);
    if (type === "周末两日路线") setDays(guide.routeOptions[0].days);
  }

  function generateGuide(event: FormEvent) {
    event.preventDefault();
    setReady(true);
    setToast(`${guide.city}${days}日攻略已按“${guideType}”整理`);
    window.setTimeout(() => routeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function shareGuide() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast(`${guide.city}攻略链接已复制`);
    } catch {
      setToast("请复制浏览器地址分享");
    }
  }

  return (
    <main className="city-guide-page">
      <header className="site-header city-site-header">
        <Link className="brand" href="/" aria-label="旅策首页"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></Link>
        <nav aria-label="城市攻略导航"><a href="#topics">实用问题</a><a href="#planner">定路线</a><a href="#itinerary">逐日攻略</a></nav>
      </header>

      <section className="city-cover">
        <Image src={guide.image} alt={guide.imageAlt} fill priority sizes="100vw" />
        <div className="city-cover-shade" />
        <div className="city-cover-copy">
          <Link href="/" className="back-link">← 返回城市列表</Link>
          <p className="eyebrow">{guide.eyebrow}</p>
          <span>{guide.province} · {guide.defaultDays}日标准方案</span>
          <h1>{guide.title}</h1>
          <p>{guide.intro}</p>
          <div><a href="#itinerary">直接看每天怎么走 ↘</a><button type="button" onClick={shareGuide}>分享这座城市 ↗</button></div>
        </div>
      </section>

      <section className="city-fit">
        <div><span>01 · HOW TO TRAVEL</span><h2>这座城市适合怎样旅行</h2></div>
        <div><p>{guide.fit}</p><p className="lodging-advice">{guide.stayAdvice}</p></div>
      </section>

      <section className="topic-section" id="topics">
        <div className="content-heading"><div><span>02 · REAL QUESTIONS</span><h2>旅行者真正会遇到的问题</h2></div><p>不是“必去榜单”，而是能直接影响路线取舍的结论。</p></div>
        <div className="practical-guide-grid">
          {guide.themes.map((item) => <article key={item.title}>
            <div><span>{item.audience}</span><em>{item.duration}</em></div>
            <h3>{item.title}</h3>
            <p>{item.advice}</p>
            <dl><div><dt>避坑</dt><dd>{item.pitfall}</dd></div><div><dt>替代</dt><dd>{item.alternative}</dd></div></dl>
            <small>{item.conclusion} · 整理于{formatChinaDate(guide.editedAt)}</small>
          </article>)}
        </div>
      </section>

      <section className="city-planner-section" id="planner">
        <div className="city-planner-intro">
          <p className="eyebrow dark">BUILD THE VERSION YOU NEED</p>
          <h2>先选攻略类型，<br />再决定每天走多满。</h2>
          <p>不再使用模糊的消费标签。只有确实会影响取舍的偏好才进入路线。</p>
        </div>
        <form className="city-planner" onSubmit={generateGuide}>
          <fieldset className="guide-type-field"><legend>你想要哪一种攻略？</legend><div>{guide.guideTypes.map((item) => <button type="button" key={item} className={guideType === item ? "active" : ""} onClick={() => chooseGuideType(item)}>{item}</button>)}</div><p>{guide.guideTypeNotes[guideType]}</p></fieldset>
          <fieldset><legend>旅行天数</legend><div className="route-option-list">{guide.routeOptions.map((option) => <button type="button" key={option.days} className={days === option.days ? "active" : ""} onClick={() => setDays(option.days)}><b>{option.label}</b><span>{option.summary}</span></button>)}</div></fieldset>
          <div className="form-row three">
            <label><span>出发日期</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label><span>每天愿意走多满</span><select value={pace} onChange={(event) => setPace(event.target.value as typeof pace)}><option>松弛</option><option>舒展</option><option>充实</option></select></label>
            <label><span>希望控制在多少元以内 <small>选填</small></span><input inputMode="numeric" value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value.replace(/[^0-9]/g, "").slice(0, 7))} placeholder="不确定可以不填" /></label>
          </div>
          <fieldset className="interest-box"><legend>这次旅行你更在意什么？ <small>最多5项</small></legend><div>{TRAVEL_INTERESTS.map((item) => <button type="button" key={item} className={interests.includes(item) ? "active" : ""} onClick={() => toggleInterest(item)}><span>{interests.includes(item) ? "✓" : "+"}</span>{item}</button>)}</div></fieldset>
          <label className="constraints"><span>必须安排或必须避开的内容 <small>选填</small></span><textarea value={mustHave} onChange={(event) => setMustHave(event.target.value)} maxLength={300} placeholder="例如：必须去故宫、不要连续两顿辣、午后需要休息……" /></label>
          <div className="planner-submit editorial-submit"><div><span>本次取舍</span><p>{guideType} · {days}天 · {pace} · {interests.slice(0, 3).join("、")}</p></div><button type="submit">整理这份攻略 <span>✦</span></button></div>
        </form>
      </section>

      <section className="editorial-itinerary" id="itinerary" ref={routeRef}>
        <div className="route-edition-head">
          <div><span>03 · YOUR MAIN ROUTE</span><h2>{guide.city}{days}日｜{guideType}</h2><p>{routeOption.summary}</p></div>
          <div><b>{pace}节奏</b><span>{interests.slice(0, 3).join(" · ")}</span>{budgetLimit && <small>希望控制在 ¥{budgetLimit} 内；只采信有来源的具体价格</small>}</div>
        </div>

        <nav className="day-jump" aria-label="逐日攻略跳转">{displayedDays.map((day, index) => <a href={`#${guide.slug}-day-${index + 1}`} key={day.title}><span>DAY {String(index + 1).padStart(2, "0")}</span><b>{day.area}</b></a>)}</nav>

        <div className="editorial-day-list">
          {displayedDays.map((day, dayIndex) => <article className="editorial-day" id={`${guide.slug}-day-${dayIndex + 1}`} key={day.title}>
            <header><div><span>DAY {String(dayIndex + 1).padStart(2, "0")} · {day.area}</span><h2>{day.title}</h2><p>{day.summary}</p></div><em>{day.nodes.length} 个节点</em></header>
            <div className="editorial-timeline">{day.nodes.map((node, nodeIndex) => {
              const source = getSource(guide, node.sourceId);
              return <section key={`${node.time}-${node.title}`}>
                <div className="editorial-time"><time>{node.time}</time><span>{String(nodeIndex + 1).padStart(2, "0")}</span></div>
                <div className="editorial-stop"><div><h3>{node.title}</h3><em>{node.meta}</em></div><p>{node.detail}</p><p className="connection"><b>怎么衔接：</b>{node.connection}</p>{node.pitfall && <p className="micro-tip"><b>容易踩坑：</b>{node.pitfall}</p>}{node.alternative && <p className="micro-alternative"><b>替代方案：</b>{node.alternative}</p>}<SourceMark source={source} label={node.factLabel} /></div>
              </section>;
            })}</div>
            <footer><div><span>为什么这样安排</span><p>{day.reason}</p></div><div><span>太累时先删</span><p>{day.remove}</p></div></footer>
          </article>)}
        </div>
      </section>

      <section className="restaurant-section">
        <div className="content-heading"><div><span>04 · RESTAURANTS IN THE ROUTE</span><h2>餐厅必须放进具体一天</h2></div><p>店名不是孤立清单。先解释为什么值得，再说明排队时怎么换。</p></div>
        <div className="editorial-restaurants">{guide.restaurants.map((item) => {
          const source = getSource(guide, item.sourceId);
          const priceSource = getSource(guide, item.priceSourceId);
          return <article key={item.name}>
            <header><div><span>{item.identity}</span><h3>{item.name}</h3></div><em>{item.plannedFor}</em></header>
            <p>{item.why}</p>
            <dl><div><dt>建议点</dt><dd>{item.order.join(" · ")}</dd></div><div><dt>不建议</dt><dd>{item.avoid}</dd></div><div><dt>所在片区</dt><dd>{item.area}</dd></div><div><dt>是否值得排队</dt><dd>{item.queue}</dd></div><div><dt>排队替代</dt><dd>{item.alternative}</dd></div>{item.price && priceSource && <div><dt>人均参考</dt><dd>{item.price}<SourceMark source={priceSource} /></dd></div>}</dl>
            <SourceMark source={source} label={`${source?.siteName ?? "资料"}已核验`} />
          </article>;
        })}</div>
      </section>

      <section className="food-section">
        <div className="content-heading"><div><span>05 · WHAT TO ORDER</span><h2>代表美食和具体点菜建议</h2></div><p>不制造无依据的人均价格；先告诉你怎么点、放在哪一餐。</p></div>
        <div className="food-notes">{guide.foods.map((food, index) => <article key={food.name}><span>{String(index + 1).padStart(2, "0")}</span><h3>{food.name}</h3><b>{food.when}</b><p>{food.order}</p><small>{food.note}</small></article>)}</div>
      </section>

      <section className="decision-section">
        <div className="content-heading"><div><span>06 · KEEP OR SKIP</span><h2>值得去与可以放弃</h2></div><p>不把每个景点都包装成“必去”。</p></div>
        <div className="decision-list">{guide.decisions.map((item) => <article key={item.name}><span className={`verdict verdict-${item.verdict}`}>{item.verdict}</span><h3>{item.name}</h3><p>{item.why}</p><small>替代：{item.alternative}</small></article>)}</div>
      </section>

      <section className="situation-section">
        <div><span>07 · WHEN THINGS CHANGE</span><h2>下雨、节假日和特殊情况</h2></div>
        <div>{guide.situations.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.advice}</p></article>)}</div>
      </section>

      <section className="pre-departure editorial-checklist"><div><span>08 · BEFORE YOU GO</span><h2>出发前完成</h2></div><ul>{guide.checklist.map((item) => <li key={item}><span aria-hidden="true">□</span>{item}</li>)}</ul></section>

      <details className="source-details editorial-sources"><summary>查看本攻略的信息来源 <span>{guide.sources.length} 条</span></summary><div>{guide.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><span>{source.category}{source.official ? " · 官方" : ""}</span><b>{source.title}</b><small>{source.siteName} · 核验于{formatChinaDate(source.checkedAt)} ↗</small></a>)}</div></details>
      <p className="verification-line">预约、开放与收费信息可能调整；动态事实以对应官方页面为准。主观建议为多来源交叉后的编辑整理，不代表单篇旅行笔记。</p>

      <footer className="city-footer"><Link className="brand" href="/"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></Link><p>{guide.city}实用旅行专刊 · 路线、餐厅与取舍一次整理清楚</p><small>© 2026 旅策</small></footer>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
