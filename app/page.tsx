"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type DayPlan = {
  label: string;
  date: string;
  theme: string;
  note: string;
  stops: Array<{
    time: string;
    title: string;
    meta: string;
    detail: string;
    tone: "sage" | "clay" | "lavender" | "blue";
    source?: string;
  }>;
};

const DAY_PLANS: DayPlan[] = [
  {
    label: "DAY 01",
    date: "10月23日 · 周五",
    theme: "东山慢行 · 从晨光到灯火",
    note: "同一区域顺路安排，下午保留 70 分钟自由时间。",
    stops: [
      {
        time: "07:10",
        title: "伏见稻荷大社",
        meta: "神社 · 建议停留 1小时40分",
        detail: "趁人流还轻，走到千本鸟居中段即可折返，不必一次登顶。",
        tone: "clay",
      },
      {
        time: "10:20",
        title: "清水寺",
        meta: "寺院 · 建议停留 1小时30分",
        detail: "官方 06:00 开门；先到主殿，再沿音羽瀑布方向顺行离场。",
        tone: "lavender",
        source: "官方开放信息",
      },
      {
        time: "12:10",
        title: "二年坂的午餐与散步",
        meta: "餐饮 · 人均约 ¥120–180",
        detail: "把午餐与街区散步合并，避开往返；预留排队弹性。",
        tone: "sage",
      },
      {
        time: "15:10",
        title: "祇园白川",
        meta: "街区 · 建议停留 1小时10分",
        detail: "沿白川缓慢步行，傍晚光线柔和，也便于直接前往晚餐。",
        tone: "blue",
      },
    ],
  },
  {
    label: "DAY 02",
    date: "10月24日 · 周六",
    theme: "岚山绿意 · 留一点空白",
    note: "早出避开高峰，下午不跨区，给咖啡和河畔散步留白。",
    stops: [
      {
        time: "07:30",
        title: "竹林小径",
        meta: "自然 · 建议停留 50分",
        detail: "从小径北侧进入，和天龙寺安排在同一动线。",
        tone: "sage",
      },
      {
        time: "09:00",
        title: "天龙寺",
        meta: "寺院 · 建议停留 1小时20分",
        detail: "重点看曹源池庭园；开放与票务信息将在生成时再次核验。",
        tone: "lavender",
        source: "出发前核验",
      },
      {
        time: "12:00",
        title: "渡月桥北岸午餐",
        meta: "餐饮 · 人均约 ¥140–220",
        detail: "选择不绕路的小店，避开商业街最拥挤的中心段。",
        tone: "clay",
      },
      {
        time: "15:00",
        title: "大堰川河畔",
        meta: "散步 · 建议停留 1小时30分",
        detail: "这段是主动留白；若下雨，可替换为室内文化空间。",
        tone: "blue",
      },
    ],
  },
  {
    label: "DAY 03",
    date: "10月25日 · 周日",
    theme: "城中日常 · 市场与庭园",
    note: "把城市生活、轻购物和传统庭园排在步行友好的范围内。",
    stops: [
      {
        time: "08:40",
        title: "锦市场",
        meta: "市场 · 建议停留 1小时20分",
        detail: "以轻食为主，保留午餐胃口；注意各店营业时间不同。",
        tone: "clay",
      },
      {
        time: "10:40",
        title: "京都御苑",
        meta: "庭园 · 建议停留 1小时20分",
        detail: "宽阔平缓，作为前两天步行后的轻松段落。",
        tone: "sage",
      },
      {
        time: "14:20",
        title: "京都国际漫画博物馆",
        meta: "室内 · 建议停留 1小时40分",
        detail: "室内备选点，遇雨可延长停留并取消后续散步。",
        tone: "lavender",
        source: "出发前核验",
      },
      {
        time: "17:00",
        title: "鸭川河畔",
        meta: "散步 · 建议停留 50分",
        detail: "根据体力决定是否保留，随时可提前结束。",
        tone: "blue",
      },
    ],
  },
  {
    label: "DAY 04",
    date: "10月26日 · 周一",
    theme: "北山收尾 · 从容返程",
    note: "只安排两个主站点，避免最后一天赶路和行李焦虑。",
    stops: [
      {
        time: "09:00",
        title: "金阁寺",
        meta: "寺院 · 建议停留 1小时15分",
        detail: "路线单向清晰，上午参观后直接向市中心移动。",
        tone: "lavender",
        source: "出发前核验",
      },
      {
        time: "11:20",
        title: "北野天满宫周边午餐",
        meta: "餐饮 · 人均约 ¥100–160",
        detail: "用一顿不赶时间的午餐结束旅程，之后回酒店取行李。",
        tone: "clay",
      },
      {
        time: "14:10",
        title: "返回酒店取行李",
        meta: "交通 · 预计 35分",
        detail: "已为返程预留 90 分钟缓冲，不再插入临时景点。",
        tone: "blue",
      },
    ],
  },
];

const progressSteps = ["理解偏好", "核实开放与交通信息", "安排顺路路线", "检查时间与预算"];

export default function Home() {
  const [activeDay, setActiveDay] = useState(0);
  const [selectedStop, setSelectedStop] = useState(1);
  const [destination, setDestination] = useState("京都");
  const [pace, setPace] = useState("舒展");
  const [budget, setBudget] = useState("适中");
  const [interests, setInterests] = useState(["古迹人文", "街区漫游", "在地餐食"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const plan = DAY_PLANS[activeDay];
  const destinationLabel = destination.trim() || "京都";

  const mapStops = useMemo(() => plan.stops.slice(0, 4), [plan]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= progressSteps.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            setIsGenerating(false);
            setToast("攻略已生成，并完成了基础约束检查");
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 500);
          return current;
        }
        return current + 1;
      });
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

  function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setProgress(0);
    setIsGenerating(true);
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
              src="https://images.unsplash.com/photo-1578399337856-c661ba5e5cec?auto=format&fit=crop&fm=jpg&q=78&w=1400"
              alt="京都清水寺的木质建筑与山景"
            />
            <div className="photo-shade" />
            <div className="postcard-top"><span>本周灵感</span><span>35.0116° N</span></div>
            <div className="postcard-copy">
              <small>KYOTO · AUTUMN</small>
              <strong>京都的秋天，<br />适合慢一点走。</strong>
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
              <p className="field-hint">可试试：京都、杭州、潮州、清迈</p>
            </div>

            <div className="form-grid">
              <div className="form-block">
                <label htmlFor="departure">出发日期</label>
                <input id="departure" className="simple-input" type="date" defaultValue="2026-10-23" />
              </div>
              <div className="form-block">
                <label htmlFor="days">旅行天数</label>
                <select id="days" className="simple-input" defaultValue="4">
                  <option value="3">3 天</option>
                  <option value="4">4 天</option>
                  <option value="5">5 天</option>
                  <option value="6">6 天</option>
                </select>
              </div>
              <div className="form-block">
                <label htmlFor="party">和谁出发</label>
                <select id="party" className="simple-input" defaultValue="couple">
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
            <span className="summary-kicker">YOUR TRIP</span>
            <h3>{destinationLabel}<small>4 DAYS</small></h3>
            <div className="summary-line"><span>日期</span><b>10.23 — 10.26</b></div>
            <div className="summary-line"><span>同行</span><b>2 位成人</b></div>
            <div className="summary-line"><span>节奏</span><b>{pace}</b></div>
            <div className="summary-line"><span>预算</span><b>{budget}</b></div>
            <div className="summary-tags">
              {interests.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
            </div>
            <button className="generate-button" type="submit" disabled={isGenerating}>
              <span>{isGenerating ? "正在生成" : "生成我的旅行"}</span>
              <b aria-hidden="true">✦</b>
            </button>
            <p className="summary-disclaimer">生成时会核实开放、票务与交通信息；无法确认的内容会明确标记。</p>
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
            <span className="trip-kicker">GENERATED ITINERARY · 示例</span>
            <h2>京都，留白的四日</h2>
            <p>2026.10.23 — 10.26 · 两人 · 舒展节奏</p>
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
            <b>7 项关键信息已核验</b>
            <span>开放与交通来源更新于 2026.08.02；天气和即时拥堵将在出发前刷新。</span>
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
          {DAY_PLANS.map((day, index) => (
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
              <div className="map-label label-one">HIGASHIYAMA</div>
              <div className="map-label label-two">KAMO RIVER</div>
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
            <p>演示版只把已核验内容标为“官方”。未接入或可能变化的内容保持透明，不会假装实时。</p>
          </div>
          <div className="source-list">
            <a href="https://www.kiyomizudera.or.jp/en/faq/" target="_blank" rel="noreferrer">
              <span className="source-level">S0 · 官方</span>
              <b>清水寺开放信息</b>
              <small>官网确认 06:00 开门，闭门时间随季节与活动调整。</small>
              <em>2026.08.02 核验 ↗</em>
            </a>
            <a href="https://www2.city.kyoto.lg.jp/kotsu/webguide/en/fare/fare_bus.html" target="_blank" rel="noreferrer">
              <span className="source-level">S0 · 官方</span>
              <b>京都市巴士票价</b>
              <small>均一区间成人普通票价 230 日元；观光特急巴士 500 日元。</small>
              <em>2026.08.02 核验 ↗</em>
            </a>
            <div className="source-pending">
              <span className="source-level pending">待刷新</span>
              <b>天气与即时拥堵</b>
              <small>尚未接入可靠的实时接口，将在出发前 14 天开始刷新。</small>
              <em>未作为确定事实使用</em>
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
