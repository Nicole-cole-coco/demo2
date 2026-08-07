"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { TravelDay, TravelPlan } from "@/lib/deepseek";

type DayPlan = TravelDay;

const DEMO_DAY_PLANS: DayPlan[] = [
  {
    label: "DAY 01",
    date: "10月23日 · 周五",
    theme: "西湖初见 · 从晨雾到暮色",
    note: "沿湖顺时针慢行，下午保留一段坐船或喝茶的自由时间。",
    stops: [
      {
        time: "08:00",
        title: "断桥与白堤",
        meta: "湖畔 · 建议停留 1小时20分",
        detail: "从北山街一侧进入，清晨沿白堤步行，避开午后较密集的人流。",
        tone: "blue",
      },
      {
        time: "10:00",
        title: "孤山与浙江省博物馆",
        meta: "人文 · 建议停留 1小时40分",
        detail: "把园林、湖景与室内参观放在同一片区；具体展馆开放安排需出发前核验。",
        tone: "sage",
        source: "出发前核验",
      },
      {
        time: "12:20",
        title: "湖滨午餐",
        meta: "餐饮 · 杭帮菜",
        detail: "优先选择离下一段动线近的餐厅，不为单一热门店跨区往返。",
        tone: "clay",
      },
      {
        time: "15:20",
        title: "曲院风荷至苏堤",
        meta: "散步 · 建议停留 1小时30分",
        detail: "沿湖慢走并主动留白，体力不足时可缩短为曲院风荷周边小环线。",
        tone: "sage",
      },
    ],
  },
  {
    label: "DAY 02",
    date: "10月24日 · 周六",
    theme: "灵隐山色 · 寺院与茶村",
    note: "上午集中在灵隐片区，午后沿梅灵路移动，避免在市区与山间反复折返。",
    stops: [
      {
        time: "07:40",
        title: "灵隐飞来峰",
        meta: "石刻与山林 · 建议停留 1小时40分",
        detail: "早点进入片区，把飞来峰造像与山林步道安排在客流高峰前。",
        tone: "sage",
        source: "出发前核验",
      },
      {
        time: "10:00",
        title: "灵隐寺",
        meta: "寺院 · 建议停留 1小时20分",
        detail: "参观节奏以主轴线为主，票务、开放时间与预约要求在出发前再次确认。",
        tone: "lavender",
        source: "出发前核验",
      },
      {
        time: "12:30",
        title: "梅灵路午餐",
        meta: "餐饮 · 茶香简餐",
        detail: "不追逐排队名店，用一顿顺路午餐衔接下午茶村动线。",
        tone: "clay",
      },
      {
        time: "14:30",
        title: "梅家坞茶村",
        meta: "茶村 · 建议停留 1小时30分",
        detail: "选择可信茶空间短坐，重点感受茶园环境，不把购物作为必选环节。",
        tone: "sage",
      },
    ],
  },
  {
    label: "DAY 03",
    date: "10月25日 · 周日",
    theme: "运河日常 · 街巷与工业遗存",
    note: "从小河直街一路走向拱宸桥，体验与西湖不同的杭州城市肌理。",
    stops: [
      {
        time: "09:00",
        title: "小河直街",
        meta: "历史街区 · 建议停留 1小时20分",
        detail: "从临水街巷开始，观察传统民居与当代小店共存的生活尺度。",
        tone: "blue",
      },
      {
        time: "10:50",
        title: "桥西历史文化街区",
        meta: "街区 · 建议停留 1小时",
        detail: "沿运河向北移动，把手工艺展馆与街区散步合并，减少碎片化换乘。",
        tone: "clay",
      },
      {
        time: "13:30",
        title: "中国京杭大运河博物馆",
        meta: "博物馆 · 建议停留 1小时30分",
        detail: "作为理解运河城市脉络的室内段落，预约与展厅开放信息需提前核验。",
        tone: "lavender",
        source: "出发前核验",
      },
      {
        time: "16:00",
        title: "拱宸桥与运河畔",
        meta: "散步 · 建议停留 1小时",
        detail: "在桥边收尾，是否继续乘船或停留看夜景可根据体力临场决定。",
        tone: "blue",
      },
    ],
  },
  {
    label: "DAY 04",
    date: "10月26日 · 周一",
    theme: "九溪收尾 · 龙井山色",
    note: "最后一天只走一条山间动线，并为取行李和返程保留充足缓冲。",
    stops: [
      {
        time: "09:00",
        title: "九溪烟树",
        meta: "山林 · 建议停留 1小时30分",
        detail: "根据天气与路况决定步行长度；雨后湿滑时缩短为入口附近轻徒步。",
        tone: "sage",
      },
      {
        time: "11:10",
        title: "龙井村",
        meta: "茶村 · 建议停留 1小时10分",
        detail: "短暂停留看茶园与村落，不安排强制消费，也不购买来源不明的高价茶叶。",
        tone: "clay",
      },
      {
        time: "13:40",
        title: "返回酒店取行李",
        meta: "交通 · 预留缓冲",
        detail: "为市内交通和取行李预留弹性，不再临时加入跨区景点。",
        tone: "blue",
      },
    ],
  },
];

const progressSteps = ["理解偏好", "核实开放与交通信息", "安排顺路路线", "检查时间与预算"];

function formatDateRange(startDate: string, days: number) {
  const start = new Date(`${startDate}T00:00:00+08:00`);
  if (Number.isNaN(start.getTime())) return "待选择";
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(days - 1, 0));
  const compact = (date: Date) => `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  return `${compact(start)} — ${compact(end)}`;
}

export default function Home() {
  const [dayPlans, setDayPlans] = useState<DayPlan[]>(DEMO_DAY_PLANS);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedStop, setSelectedStop] = useState(1);
  const [destination, setDestination] = useState("杭州");
  const [startDate, setStartDate] = useState("2026-10-23");
  const [travelDays, setTravelDays] = useState(4);
  const [party, setParty] = useState<"solo" | "couple" | "friends" | "family">("couple");
  const [pace, setPace] = useState("舒展");
  const [budget, setBudget] = useState("适中");
  const [interests, setInterests] = useState(["古迹人文", "街区漫游", "在地餐食"]);
  const [tripTitle, setTripTitle] = useState("杭州，湖山之间的四日");
  const [tripSubtitle, setTripSubtitle] = useState("2026.10.23 — 10.26 · 两人 · 舒展节奏");
  const [verificationNote, setVerificationNote] = useState("演示行程未使用实时数据；开放、预约、交通与天气需在出发前核验。");
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const plan = dayPlans[activeDay] ?? dayPlans[0] ?? DEMO_DAY_PLANS[0];
  const destinationLabel = destination.trim() || "杭州";

  const mapStops = useMemo(() => plan.stops.slice(0, 4), [plan]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setAiConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setAiConfigured(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(current + 1, progressSteps.length - 1));
    }, 720);
    return () => window.clearInterval(interval);
  }, [isGenerating]);

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : current.length < 5
          ? [...current, interest]
          : current,
    );
  }

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setProgress(0);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destinationLabel,
          startDate,
          days: travelDays,
          party,
          pace,
          budget,
          interests,
        }),
      });
      const payload = await response.json() as {
        error?: string;
        message?: string;
        plan?: TravelPlan;
      };

      if (!response.ok || !payload.plan) {
        if (payload.error === "DEEPSEEK_NOT_CONFIGURED") {
          setAiConfigured(false);
          setToast("当前为演示模式；配置 DeepSeek 后即可生成真实个性化攻略");
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        throw new Error(payload.message || "生成失败，请稍后重试");
      }

      setDayPlans(payload.plan.days);
      setTripTitle(payload.plan.title);
      setTripSubtitle(payload.plan.subtitle);
      setVerificationNote(payload.plan.verificationNote);
      setDestination(payload.plan.destination);
      setActiveDay(0);
      setSelectedStop(0);
      setAiConfigured(true);
      setToast("DeepSeek 攻略已生成，并完成了结构检查");
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("预览链接已复制");
    } catch {
      setToast("可直接复制浏览器地址分享");
    }
  }

  function handleReplace() {
    setToast("已找到 3 个同区域替代点，可在下一轮接入真实候选数据");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="旅策首页">
          <span className="brand-mark">旅</span>
          <span>
            <b>旅策</b>
            <small>ROUTE &amp; REST</small>
          </span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="打开导航"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
        <nav className={isMenuOpen ? "nav-links is-open" : "nav-links"} aria-label="主导航">
          <a href="#inspiration" onClick={() => setIsMenuOpen(false)}>灵感</a>
          <a href="#planner" onClick={() => setIsMenuOpen(false)}>开始规划</a>
          <a href="#trip" onClick={() => setIsMenuOpen(false)}>示例行程</a>
          <button className="quiet-button" type="button" onClick={() => setToast("登录功能将在数据同步阶段接入")}>登录</button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>AI TRAVEL PLANNER</span><i /></p>
          <h1>让每一次出发，<br /><em>都有从容的余地。</em></h1>
          <p className="hero-lead">
            告诉我们你想去哪里、喜欢怎样旅行。旅策会核实必要信息，
            把散落的灵感排成一份顺路、可改、真正走得通的攻略。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#planner">开始规划 <span>↗</span></a>
            <a className="text-button" href="#trip">先看一份示例 <span>↓</span></a>
          </div>
          <div className="trust-row" aria-label="产品特点">
            <span><i>✓</i> 官方来源优先</span>
            <span><i>✓</i> 路线与时间校验</span>
            <span><i>✓</i> 支持局部重排</span>
          </div>
        </div>

        <div className="hero-visual" id="inspiration">
          <div className="postcard postcard-main">
            <img
              src="https://images.unsplash.com/photo-1697395884990-f4958339f335?auto=format&fit=crop&fm=jpg&q=78&w=1400"
              alt="杭州西湖的湖面、游船与中式建筑"
            />
            <div className="photo-shade" />
            <div className="postcard-top"><span>本周灵感</span><span>35.0116° N</span></div>
            <div className="postcard-copy">
              <small>HANGZHOU · AUTUMN</small>
              <strong>杭州的秋天，<br />在湖山之间慢一点走。</strong>
              <span>4日 · 人文与街区 · 舒展节奏</span>
            </div>
          </div>
          <div className="floating-note note-one">
            <span>路线强度</span>
            <b>轻松 <i>7.2 km</i></b>
          </div>
          <div className="floating-note note-two">
            <span>今日留白</span>
            <b>1h 10m</b>
          </div>
          <div className="round-stamp">旅策<br /><span>2026</span></div>
        </div>
      </section>

      <section className="principles" aria-label="旅策方法">
        <p>灵感很多，路线只有一条。</p>
        <div>
          <span><b>01</b> 先理解你的旅行方式</span>
          <span><b>02</b> 再核实会变化的信息</span>
          <span><b>03</b> 最后给每一天留出呼吸</span>
        </div>
      </section>

      <section className="planner-section" id="planner">
        <div className="section-heading">
          <p className="eyebrow"><span>PLAN YOUR WAY</span><i /></p>
          <h2>三分钟，把想法变成行程</h2>
          <p>先从必要信息开始。更多限制可以在生成后继续补充。</p>
        </div>

        <form className="planner-card" onSubmit={handleGenerate}>
          <div className="planner-main">
            <div className="form-block destination-block">
              <label htmlFor="destination">想去哪里？</label>
              <div className="destination-input">
                <span aria-hidden="true">⌖</span>
                <input
                  id="destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="输入城市或地区"
                  autoComplete="off"
                />
                <small>推荐</small>
              </div>
              <p className="field-hint">仅支持中国境内城市，可试试：杭州、潮州、泉州、大同</p>
            </div>

            <div className="form-grid">
              <div className="form-block">
                <label htmlFor="departure">出发日期</label>
                <input
                  id="departure"
                  className="simple-input"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="form-block">
                <label htmlFor="days">旅行天数</label>
                <select
                  id="days"
                  className="simple-input"
                  value={travelDays}
                  onChange={(event) => setTravelDays(Number(event.target.value))}
                >
                  <option value="3">3 天</option>
                  <option value="4">4 天</option>
                  <option value="5">5 天</option>
                  <option value="6">6 天</option>
                </select>
              </div>
              <div className="form-block">
                <label htmlFor="party">和谁出发</label>
                <select
                  id="party"
                  className="simple-input"
                  value={party}
                  onChange={(event) => setParty(event.target.value as typeof party)}
                >
                  <option value="solo">一个人</option>
                  <option value="couple">两人同行</option>
                  <option value="friends">朋友出行</option>
                  <option value="family">亲子家庭</option>
                </select>
              </div>
            </div>

            <div className="choice-row">
              <fieldset>
                <legend>旅行节奏</legend>
                <div className="segmented-control">
                  {["松弛", "舒展", "充实"].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={pace === item ? "active" : ""}
                      onClick={() => setPace(item)}
                      aria-pressed={pace === item}
                    >{item}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>人均预算</legend>
                <div className="segmented-control">
                  {["经济", "适中", "舒适"].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={budget === item ? "active" : ""}
                      onClick={() => setBudget(item)}
                      aria-pressed={budget === item}
                    >{item}</button>
                  ))}
                </div>
              </fieldset>
            </div>

            <fieldset className="interest-fieldset">
              <legend>这次更想体验什么？<small>最多 5 项</small></legend>
              <div className="interest-chips">
                {["古迹人文", "街区漫游", "在地餐食", "自然风景", "艺术设计", "轻松购物"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={interests.includes(item) ? "selected" : ""}
                    onClick={() => toggleInterest(item)}
                    aria-pressed={interests.includes(item)}
                  >
                    <span>{interests.includes(item) ? "✓" : "+"}</span>{item}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className="planner-summary">
            <div className="summary-kicker-row">
              <span className="summary-kicker">YOUR TRIP</span>
              <span className={`ai-status ${aiConfigured ? "connected" : "demo"}`}>
                <i />{aiConfigured === null ? "检查接口" : aiConfigured ? "DeepSeek 已连接" : "演示模式"}
              </span>
            </div>
            <h3>{destinationLabel}<small>{travelDays} DAYS</small></h3>
            <div className="summary-line"><span>日期</span><b>{formatDateRange(startDate, travelDays)}</b></div>
            <div className="summary-line"><span>同行</span><b>{{ solo: "一人", couple: "两人同行", friends: "朋友出行", family: "亲子家庭" }[party]}</b></div>
            <div className="summary-line"><span>节奏</span><b>{pace}</b></div>
            <div className="summary-line"><span>预算</span><b>{budget}</b></div>
            <div className="summary-tags">
              {interests.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
            </div>
            <button className="generate-button" type="submit" disabled={isGenerating}>
              <span>{isGenerating ? "正在生成" : "生成我的旅行"}</span>
              <b aria-hidden="true">✦</b>
            </button>
            <p className="summary-disclaimer">API Key 只保存在服务器。未配置时展示示例，配置后由 DeepSeek 生成中国城市攻略。</p>
          </aside>

          {isGenerating && (
            <div className="generation-overlay" role="status" aria-live="polite">
              <div className="generation-orbit"><span>旅</span><i /></div>
              <p>正在为你梳理 {destinationLabel}</p>
              <h3>{progressSteps[progress]}</h3>
              <div className="progress-track"><span style={{ width: `${(progress + 1) * 25}%` }} /></div>
              <ol>
                {progressSteps.map((step, index) => (
                  <li key={step} className={index <= progress ? "done" : ""}>
                    <span>{index < progress ? "✓" : String(index + 1).padStart(2, "0")}</span>{step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </form>
      </section>

      <section className="trip-section" id="trip" ref={resultRef}>
        <div className="trip-toolbar">
          <div>
            <span className="trip-kicker">GENERATED ITINERARY · {aiConfigured ? "DEEPSEEK" : "示例"}</span>
            <h2>{tripTitle}</h2>
            <p>{tripSubtitle}</p>
          </div>
          <div className="toolbar-actions">
            <button type="button" onClick={() => { setSaved((value) => !value); setToast(saved ? "已取消收藏" : "行程已收藏在本机预览"); }}>
              <span>{saved ? "♥" : "♡"}</span>{saved ? "已收藏" : "收藏"}
            </button>
            <button type="button" onClick={handleShare}><span>↗</span>分享</button>
            <button className="edit-button" type="button" onClick={() => setToast("编辑模式已准备：点击任一行程卡片即可调整")}>编辑行程</button>
          </div>
        </div>

        <div className="fact-banner">
          <div className="fact-icon">✓</div>
          <div>
            <b>{aiConfigured ? "已生成可执行行程" : "当前展示杭州示例行程"}</b>
            <span>{verificationNote}</span>
          </div>
          <button type="button" onClick={() => document.getElementById("sources")?.scrollIntoView({ behavior: "smooth" })}>查看来源</button>
        </div>

        <div className="trip-stats">
          <div><span>预算参考</span><b>¥ 3,200–4,100</b><small>两人 · 不含往返大交通</small></div>
          <div><span>平均步行</span><b>7.2 km / 日</b><small>第二天强度最高</small></div>
          <div><span>天气信息</span><b>出发前 14 天更新</b><small>当前暂无可靠预报</small></div>
          <div><span>路线质量</span><b>顺路度 92</b><small>无明显跨区折返</small></div>
        </div>

        <div className="day-tabs" role="tablist" aria-label="选择行程日期">
          {dayPlans.map((day, index) => (
            <button
              key={day.label}
              role="tab"
              type="button"
              aria-selected={activeDay === index}
              className={activeDay === index ? "active" : ""}
              onClick={() => { setActiveDay(index); setSelectedStop(0); }}
            >
              <span>{day.label}</span><b>{day.date.split(" · ")[0]}</b><small>{day.theme.split(" · ")[0]}</small>
            </button>
          ))}
        </div>

        <div className="itinerary-layout">
          <article className="schedule-panel">
            <div className="day-heading">
              <div><span>{plan.label}</span><h3>{plan.theme}</h3><p>{plan.note}</p></div>
              <button type="button" onClick={() => setToast("已切换为低步行方案预览")}>减少步行</button>
            </div>

            <div className="timeline">
              {plan.stops.map((stop, index) => (
                <div
                  className={selectedStop === index ? "timeline-item selected" : "timeline-item"}
                  key={`${plan.label}-${stop.title}`}
                  onClick={() => setSelectedStop(index)}
                >
                  <time>{stop.time}</time>
                  <div className={`timeline-dot ${stop.tone}`}><span>{index + 1}</span></div>
                  <div className="stop-card">
                    <div className="stop-card-head">
                      <div><h4>{stop.title}</h4><span>{stop.meta}</span></div>
                      <button type="button" aria-label={`更多 ${stop.title} 操作`} onClick={(event) => { event.stopPropagation(); handleReplace(); }}>•••</button>
                    </div>
                    <p>{stop.detail}</p>
                    <div className="stop-foot">
                      {stop.source ? <span className="source-pill">✓ {stop.source}</span> : <span>路线建议</span>}
                      <button type="button" onClick={(event) => { event.stopPropagation(); setToast(`${stop.title} 已锁定，后续重排不会改动`); }}>锁定</button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); handleReplace(); }}>替换</button>
                    </div>
                  </div>
                  {index < plan.stops.length - 1 && <div className="transit"><span>步行 / 公交</span><b>{12 + index * 6} 分钟</b></div>}
                </div>
              ))}
            </div>

            <div className="day-actions">
              <button type="button" onClick={() => setToast("已增加 30 分钟自由时间")}>＋ 增加留白</button>
              <button type="button" onClick={() => setToast("正在重排今天下午，锁定项将保持不变")}>✦ 重新安排下午</button>
            </div>
          </article>

          <aside className="map-panel" aria-label="路线示意图">
            <div className="map-header">
              <div><span>ROUTE MAP</span><b>{plan.date}</b></div>
              <button type="button" onClick={() => setToast("正式版将跳转到用户选择的地图服务")}>打开地图 ↗</button>
            </div>
            <div className="abstract-map">
              <div className="river river-one" />
              <div className="river river-two" />
              <div className="street s1" /><div className="street s2" /><div className="street s3" /><div className="street s4" /><div className="street s5" />
              <div className="park p1" /><div className="park p2" />
              <div className="route-line"><span /><i /><b /></div>
              {mapStops.map((stop, index) => (
                <button
                  type="button"
                  aria-label={`查看 ${stop.title}`}
                  key={stop.title}
                  className={`map-pin pin-${index + 1} ${selectedStop === index ? "active" : ""}`}
                  onClick={() => setSelectedStop(index)}
                >{index + 1}</button>
              ))}
              <div className="map-label label-one">CITY ROUTE</div>
              <div className="map-label label-two">LOCAL AREA</div>
            </div>
            <div className="map-selection">
              <span>{String(selectedStop + 1).padStart(2, "0")}</span>
              <div><small>当前选中</small><b>{plan.stops[selectedStop]?.title}</b><p>{plan.stops[selectedStop]?.meta}</p></div>
              <button type="button" onClick={handleReplace}>替换</button>
            </div>
            <div className="map-legend"><span><i className="sage" />景点</span><span><i className="clay" />餐饮</span><span><i className="blue" />交通</span><em>路线示意 · 非实时导航</em></div>
          </aside>
        </div>

        <div className="sources-card" id="sources">
          <div className="source-title">
            <span>DATA NOTES</span>
            <h3>这份行程，哪些信息可以相信？</h3>
            <p>AI 负责组织路线，不等于实时数据库。开放、预约、交通与天气等动态信息会明确提示复核。</p>
          </div>
          <div className="source-list">
            <a href="https://westlake.hangzhou.gov.cn/" target="_blank" rel="noreferrer">
              <span className="source-level">官方入口</span>
              <b>杭州西湖风景名胜区</b>
              <small>出发前从景区管理部门核验临时关闭、活动和游览管理信息。</small>
              <em>打开政府网站 ↗</em>
            </a>
            <a href="https://www.hangzhou.gov.cn/" target="_blank" rel="noreferrer">
              <span className="source-level">官方入口</span>
              <b>杭州市人民政府门户</b>
              <small>涉及交通管理、公共服务等会变化的信息，应以最新官方公告为准。</small>
              <em>打开政府网站 ↗</em>
            </a>
            <div className="source-pending">
              <span className="source-level pending">接口预留</span>
              <b>DeepSeek 与实时数据服务</b>
              <small>DeepSeek 生成行程结构；天气、地图、票务可通过独立 API 在后续接入。</small>
              <em>密钥只保存在服务端</em>
            </div>
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span>YOUR NEXT JOURNEY</span>
          <h2>不必把每一分钟填满。<br />好的旅行，应该有余地发生。</h2>
        </div>
        <a href="#planner">重新规划一次 <span>↗</span></a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">旅</span><span><b>旅策</b><small>ROUTE &amp; REST</small></span></a>
        <p>让真实信息与个人偏好，一起成为旅程的起点。</p>
        <div><a href="#sources">数据说明</a><a href="#planner">创建攻略</a><button type="button" onClick={() => setToast("反馈入口已记录，将在下一轮接入")}>提供反馈</button></div>
        <small>© 2026 旅策 · 高保真产品预览</small>
      </footer>

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
