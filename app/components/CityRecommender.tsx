"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { PUBLISHED_CITY_GUIDES, preferenceRelevance, type CityPreference } from "@/content/cities";

type Answers = {
  preference: CityPreference;
  season: "不限" | "春季" | "夏季" | "秋季" | "冬季";
  pace: "轻松" | "正常" | "紧凑";
  days: 2 | 3 | 4;
  budget: "控制支出" | "常规" | "预算宽松";
};

const DEFAULT_ANSWERS: Answers = { preference: "城市漫游", season: "不限", pace: "正常", days: 3, budget: "常规" };
const PREFERENCES: CityPreference[] = ["第一次必去", "地道美食", "城市漫游", "建筑摄影", "博物馆", "自然风景", "夜生活", "松弛休息", "少排队", "小众体验"];

function budgetCeiling(value: string) {
  const values = value.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ""))) ?? [];
  return values.length ? Math.max(...values) : 0;
}

function idealDayMatch(value: string, days: number) {
  const values = value.match(/\d+/g)?.map(Number) ?? [];
  if (!values.length) return true;
  return days >= Math.min(...values) && days <= Math.max(...values);
}

export default function CityRecommender() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    const requestedBudget = answers.budget === "控制支出" ? 600 : answers.budget === "常规" ? 900 : Number.POSITIVE_INFINITY;
    return PUBLISHED_CITY_GUIDES.map((guide) => {
      let score = preferenceRelevance(guide, answers.preference);
      const reasons: string[] = [];
      const mismatches: string[] = [];
      const seasonMatched = answers.season === "不限" || guide.recommendedSeasons.includes(answers.season) || guide.recommendedSeasons.includes("全年适合");
      if (seasonMatched) {
        score += 34;
        reasons.push(answers.season === "不限" ? `适合围绕“${answers.preference}”安排行程` : `${answers.season}在推荐季节范围内`);
      } else {
        score -= 28;
        mismatches.push(`${answers.season}不是资料中的优先季节`);
      }
      if (idealDayMatch(guide.idealDays, answers.days)) {
        score += 22;
        reasons.push(`${answers.days}天落在建议停留区间`);
      } else {
        mismatches.push(`常规建议停留为${guide.idealDays}`);
      }
      const ceiling = budgetCeiling(guide.dailyBudget);
      if (!Number.isFinite(requestedBudget) || !ceiling || ceiling <= requestedBudget) {
        score += 15;
        reasons.push(answers.budget === "预算宽松" ? "预算约束较少" : "日常预算更容易控制");
      } else {
        score -= Math.min(24, (ceiling - requestedBudget) / 25);
        mismatches.push(`资料中的日预算上沿约${guide.dailyBudget}`);
      }
      const relaxed = preferenceRelevance(guide, "松弛休息");
      if (answers.pace === "轻松") {
        score += relaxed / 3;
        if (relaxed < 18) mismatches.push("核心体验可能需要较多移动");
      }
      if (answers.pace === "紧凑") score += preferenceRelevance(guide, "少折返") / 4;
      if (answers.pace === "正常") score += 8;
      return {
        guide,
        score,
        reason: reasons.slice(0, 2).join("；"),
        mismatch: mismatches[0] ?? (answers.pace === "紧凑" ? "紧凑安排仍需为预约与换乘留缓冲" : "热门时段仍需使用攻略内的错峰与替代方案"),
      };
    }).sort((a, b) => b.score - a.score || a.guide.city.localeCompare(b.guide.city, "zh-CN")).slice(0, 3);
  }, [answers]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <button type="button" className="recommend-trigger" onClick={() => setOpen(true)}>帮我选一座城市 <span>3 个结果</span></button>
      {open && <div className="recommend-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section className="recommend-dialog" role="dialog" aria-modal="true" aria-labelledby="recommend-title">
          <header><div><span>LOCAL MATCHING · NO AI REQUIRED</span><h2 id="recommend-title">帮我选一座城市</h2><p>回答四个简单问题，使用站内 50 座城市的结构化资料匹配，不上传你的答案。</p></div><button type="button" aria-label="关闭推荐问答" onClick={() => setOpen(false)}>×</button></header>
          {!submitted ? <form onSubmit={submit}>
            <fieldset><legend>1. 这次最想得到什么？</legend><div className="recommend-options">{PREFERENCES.map((item) => <button type="button" className={answers.preference === item ? "active" : ""} key={item} onClick={() => setAnswers((value) => ({ ...value, preference: item }))}>{item}</button>)}</div></fieldset>
            <div className="recommend-question-grid">
              <label><span>2. 出行季节</span><select value={answers.season} onChange={(event) => setAnswers((value) => ({ ...value, season: event.target.value as Answers["season"] }))}>{["不限", "春季", "夏季", "秋季", "冬季"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>3. 旅行节奏</span><select value={answers.pace} onChange={(event) => setAnswers((value) => ({ ...value, pace: event.target.value as Answers["pace"] }))}>{["轻松", "正常", "紧凑"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>4. 可用天数</span><select value={answers.days} onChange={(event) => setAnswers((value) => ({ ...value, days: Number(event.target.value) as Answers["days"] }))}>{[2, 3, 4].map((item) => <option value={item} key={item}>{item}天</option>)}</select></label>
              <label><span>预算倾向</span><select value={answers.budget} onChange={(event) => setAnswers((value) => ({ ...value, budget: event.target.value as Answers["budget"] }))}>{["控制支出", "常规", "预算宽松"].map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <footer><small>推荐只使用编辑资料与定性规则，不声称实时客流、实时价格或实时交通。</small><button type="submit">查看 3 个候选城市</button></footer>
          </form> : <div className="recommend-results">
            <div className="recommend-result-summary"><p>你的选择</p><b>{answers.preference} · {answers.season} · {answers.days}天 · {answers.pace} · {answers.budget}</b></div>
            {results.map(({ guide, reason, mismatch }, index) => <article key={guide.slug}>
              <span>0{index + 1}</span><div><h3>{guide.city}</h3><p><b>匹配理由</b>{reason}</p><p className="recommend-mismatch"><b>需要留意</b>{mismatch}</p><small>{guide.recommendedSeasons.join(" / ")} · {guide.idealDays} · {guide.dailyBudget}</small></div>
              <Link href={`/city/${guide.slug}?preference=${encodeURIComponent(answers.preference)}`}>查看匹配路线 ↗</Link>
            </article>)}
            <footer><button type="button" onClick={() => setSubmitted(false)}>修改答案</button><button type="button" onClick={() => { setAnswers(DEFAULT_ANSWERS); setSubmitted(false); }}>重新开始</button></footer>
          </div>}
        </section>
      </div>}
    </>
  );
}
