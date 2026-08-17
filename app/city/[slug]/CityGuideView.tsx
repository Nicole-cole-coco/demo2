"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatChinaDate } from "@/lib/date-format";
import type { CityRoutePreference, CompleteCityGuide } from "@/content/cities/types";
import { TRAVEL_INTERESTS, type EditorialDay, type GuideSource, type ItineraryNode } from "@/lib/editorial-city-guides";
import MyTravelDrawer, { notifyPersonalTravelChanged, type SavedTravelItem } from "@/app/components/MyTravelDrawer";

const ROUTE_PREFERENCES = [...TRAVEL_INTERESTS, "雨天替代"] as const satisfies readonly CityRoutePreference[];
const GUIDE_TYPE_PREFERENCE: Record<string, CityRoutePreference | "全部"> = {
  第一次经典路线: "第一次必去",
  本地吃喝路线: "地道美食",
  城市漫游路线: "城市漫游",
  拍照建筑路线: "建筑摄影",
  博物馆路线: "博物馆",
  周末两日路线: "少折返",
  松弛休息路线: "松弛休息",
  亲子路线: "少排队",
  雨天备用路线: "雨天替代",
};
const SECTION_NAV = [
  ["overview", "概览"], ["topics", "必去与体验"], ["planner", "定路线"], ["itinerary", "逐日攻略"],
  ["restaurants", "餐厅"], ["foods", "美食"], ["practical", "避坑与实用"], ["sources", "来源"],
] as const;

function getGuideSource(guide: CompleteCityGuide, sourceId?: string) {
  if (!sourceId) return undefined;
  return guide.sources.find((source) => source.id === sourceId);
}

function SourceMark({ source, label }: { source?: GuideSource; label?: string }) {
  if (!source) return null;
  return <a className="fact-source" href={source.url} target="_blank" rel="noreferrer">{label ?? "查看资料"} · 更新于{formatChinaDate(source.checkedAt)} ↗</a>;
}

function CityMediaImage({ src, fallback, alt, priority = false, sizes }: { src: string; fallback: string; alt: string; priority?: boolean; sizes: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  return <Image src={resolvedSrc} alt={alt} fill priority={priority} sizes={sizes} data-loaded={loaded ? "true" : "false"} onLoad={() => setLoaded(true)} onError={() => { if (resolvedSrc !== fallback) { setLoaded(false); setResolvedSrc(fallback); } }} />;
}

function cloneDays(days: EditorialDay[]) {
  return JSON.parse(JSON.stringify(days)) as EditorialDay[];
}

function storedItems(key: string): SavedTravelItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

type UndoSnapshot = {
  itinerary: EditorialDay[];
  key: string;
  preference: "全部" | CityRoutePreference;
  days: number;
  guideType: string;
  label: string;
};

export default function CityGuideView({ guide }: { guide: CompleteCityGuide }) {
  const [guideType, setGuideType] = useState("第一次经典路线");
  const [days, setDays] = useState(guide.defaultDays);
  const [travelMonth, setTravelMonth] = useState("10月");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");
  const [pace, setPace] = useState<"轻松" | "正常" | "紧凑">("正常");
  const [interests, setInterests] = useState<string[]>(["第一次必去", "地道美食", "少折返"]);
  const [mustHave, setMustHave] = useState("");
  const [notInterested, setNotInterested] = useState("");
  const [earlyStart, setEarlyStart] = useState(false);
  const [longWalk, setLongWalk] = useState(true);
  const [rainBackup, setRainBackup] = useState(true);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [savedPlan, setSavedPlan] = useState(false);
  const [customDays, setCustomDays] = useState<EditorialDay[]>([]);
  const [customDaysKey, setCustomDaysKey] = useState("");
  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [activePreference, setActivePreference] = useState<"全部" | CityRoutePreference>("全部");
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<SavedTravelItem[]>([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<SavedTravelItem[]>([]);
  const [uninterested, setUninterested] = useState<SavedTravelItem[]>([]);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [nearbyCard, setNearbyCard] = useState("");
  const [cardDayTargets, setCardDayTargets] = useState<Record<string, number>>({});
  const [activeSection, setActiveSection] = useState("overview");
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false);
  const [lastChange, setLastChange] = useState("");
  const imageFallback = `/cities/${guide.slug}-detail-1.jpg`;
  const imageFor = (role: CompleteCityGuide["images"][number]["role"], subject: string) => guide.images.find((image) => image.role === role && image.subject === subject);
  const imageForNode = (_dayIndex: number, title: string, subject?: string) => {
    const wanted = subject ?? title.replace(/午餐|晚餐|夜间体验/g, "").trim();
    return guide.images.find((image) => image.subject && (image.subject === wanted || wanted.includes(image.subject) || image.subject.includes(wanted)));
  };
  const routeRef = useRef<HTMLElement>(null);

  const routeOption = useMemo(() => guide.routes.find((option) => option.days === days) ?? guide.routes.at(-1)!, [days, guide.routes]);
  const preferenceRoute = activePreference === "全部" ? undefined : guide.preferenceRoutes.find((item) => item.preference === activePreference);
  const baseDisplayedDays = useMemo(
    () => preferenceRoute ? preferenceRoute.itinerary.slice(0, days) : routeOption.itinerary,
    [days, preferenceRoute, routeOption.itinerary],
  );
  const activeRouteProfile = preferenceRoute ?? routeOption;
  const baseRouteKey = `${guide.slug}:${activePreference}:${days}`;
  const displayedDays = customDaysKey === baseRouteKey && customDays.length ? customDays : baseDisplayedDays;
  const filteredPreferenceContent = activePreference === "全部"
    ? guide.preferenceContent.slice(0, 12)
    : guide.preferenceContent.filter((item) => item.tags.includes(activePreference === "雨天替代" ? "博物馆" : activePreference));
  const visibleExperiences = guide.experiences
    .filter((experience) => !uninterested.some((item) => item.citySlug === guide.slug && item.name === experience.name))
    .filter((experience) => activePreference === "全部" || filteredPreferenceContent.some((item) => item.title.includes(experience.name) || item.summary.includes(experience.name)))
    .slice(0, activePreference === "全部" ? 8 : 5);
  const displayedRestaurants = useMemo(() => {
    const routeText = displayedDays.flatMap((day) => day.nodes.map((node) => `${node.title}${node.detail}`)).join(" ");
    return [...guide.restaurants]
      .filter((restaurant) => !uninterested.some((item) => item.citySlug === guide.slug && item.name === restaurant.name))
      .sort((a, b) => {
        const routeDifference = Number(routeText.includes(b.name)) - Number(routeText.includes(a.name));
        if (routeDifference) return routeDifference;
        if (activePreference === "少排队") return Number(/排|等位|高峰/.test(a.queue)) - Number(/排|等位|高峰/.test(b.queue));
        return 0;
      });
  }, [activePreference, displayedDays, guide.restaurants, guide.slug, uninterested]);
  const displayedFoods = useMemo(() => activePreference === "地道美食" || activePreference === "标志性餐厅"
    ? guide.foods
    : [...guide.foods].sort((a, b) => Number(displayedDays.some((day) => day.nodes.some((node) => node.detail.includes(b.name)))) - Number(displayedDays.some((day) => day.nodes.some((node) => node.detail.includes(a.name))))), [activePreference, displayedDays, guide.foods]);
  const storyImages = useMemo(() => {
    const preferredRole = activePreference === "地道美食" || activePreference === "标志性餐厅" ? ["food", "restaurant"]
      : activePreference === "城市漫游" || activePreference === "松弛休息" || activePreference === "夜生活" ? ["lifestyle", "neighborhood"]
        : ["poi", "landmark", "lifestyle"];
    const selected = guide.images.filter((image) => preferredRole.includes(image.role));
    return (selected.length ? selected : guide.images.filter((image) => image.role === "landmark" || image.role === "neighborhood")).slice(0, 3);
  }, [activePreference, guide.images]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const currentUrl = new URL(window.location.href);
        const urlPreference = currentUrl.searchParams.get("preference");
        if (urlPreference && ROUTE_PREFERENCES.includes(urlPreference as CityRoutePreference)) setActivePreference(urlPreference as CityRoutePreference);
        const saved = localStorage.getItem(`lvce-city-form-${guide.slug}`);
        if (saved) {
          const value = JSON.parse(saved) as Partial<{ guideType: string; days: number; travelMonth: string; startTime: string; endTime: string; pace: typeof pace; interests: string[]; mustHave: string; notInterested: string; earlyStart: boolean; longWalk: boolean; rainBackup: boolean }>;
          if (value.guideType && guide.guideTypes.includes(value.guideType)) setGuideType(value.guideType);
          if (typeof value.days === "number" && guide.routes.some((option) => option.days === value.days)) setDays(value.days);
          if (typeof value.travelMonth === "string") setTravelMonth(value.travelMonth);
          if (typeof value.startTime === "string") setStartTime(value.startTime);
          if (typeof value.endTime === "string") setEndTime(value.endTime);
          if (value.pace && ["轻松", "正常", "紧凑"].includes(value.pace)) setPace(value.pace);
          if (Array.isArray(value.interests)) setInterests(value.interests.slice(0, 5));
          if (typeof value.mustHave === "string") setMustHave(value.mustHave);
          if (typeof value.notInterested === "string") setNotInterested(value.notInterested);
          if (typeof value.earlyStart === "boolean") setEarlyStart(value.earlyStart);
          if (typeof value.longWalk === "boolean") setLongWalk(value.longWalk);
          if (typeof value.rainBackup === "boolean") setRainBackup(value.rainBackup);
        }
        const favorites = JSON.parse(localStorage.getItem("lvce-favorite-cities") ?? "[]") as string[];
        setFavorite(favorites.includes(guide.slug));
        setFavoritePlaces(storedItems("lvce-favorite-places"));
        setFavoriteRestaurants(storedItems("lvce-favorite-restaurants"));
        setUninterested(storedItems("lvce-not-interested"));
        let restoredSharedRoute = false;
        if (currentUrl.hash.startsWith("#route=")) {
          try {
            const value = JSON.parse(decodeURIComponent(currentUrl.hash.slice(7))) as Partial<{ baseDays: number; guideType: string; preference: "全部" | CityRoutePreference; travelMonth: string; pace: typeof pace; itinerary: EditorialDay[] }>;
            const sharedPreference = value.preference && (value.preference === "全部" || ROUTE_PREFERENCES.includes(value.preference as CityRoutePreference)) ? value.preference : "全部";
            const sharedDays = typeof value.baseDays === "number" && guide.routes.some((option) => option.days === value.baseDays) ? value.baseDays : guide.defaultDays;
            if (Array.isArray(value.itinerary) && value.itinerary.length && value.itinerary.every((day) => day && Array.isArray(day.nodes))) {
              setDays(sharedDays);
              setActivePreference(sharedPreference);
              setCustomDays(value.itinerary);
              setCustomDaysKey(`${guide.slug}:${sharedPreference}:${sharedDays}`);
              if (value.guideType && guide.guideTypes.includes(value.guideType)) setGuideType(value.guideType);
              if (typeof value.travelMonth === "string") setTravelMonth(value.travelMonth);
              if (value.pace && ["轻松", "正常", "紧凑"].includes(value.pace)) setPace(value.pace);
              restoredSharedRoute = true;
              setLastChange("已从分享链接还原当前路线");
            }
          } catch { /* 分享参数不完整时继续显示基础路线 */ }
        }
        const savedItinerary = localStorage.getItem(`lvce-saved-itinerary-${guide.slug}`);
        if (savedItinerary) {
          const value = JSON.parse(savedItinerary) as Partial<{ days: number; baseDays: number; guideType: string; preference: "全部" | CityRoutePreference; itinerary: EditorialDay[] }>;
          const savedPreference = value.preference && (value.preference === "全部" || ROUTE_PREFERENCES.includes(value.preference as CityRoutePreference)) ? value.preference : "全部";
          const storedBaseDays = value.baseDays ?? value.days;
          const savedDays = typeof storedBaseDays === "number" && guide.routes.some((option) => option.days === storedBaseDays) ? storedBaseDays : guide.defaultDays;
          const effectivePreference = urlPreference && ROUTE_PREFERENCES.includes(urlPreference as CityRoutePreference) ? urlPreference as CityRoutePreference : savedPreference;
          const canRestoreSavedRoute = !restoredSharedRoute && (!urlPreference || effectivePreference === savedPreference);
          if (canRestoreSavedRoute && Array.isArray(value.itinerary) && value.itinerary.length && value.itinerary.every((day) => day && Array.isArray(day.nodes))) {
            setDays(savedDays);
            setActivePreference(effectivePreference);
            setCustomDays(value.itinerary);
            setCustomDaysKey(`${guide.slug}:${effectivePreference}:${savedDays}`);
          }
          if (value.guideType && guide.guideTypes.includes(value.guideType)) setGuideType(value.guideType);
          setSavedPlan(true);
        }
        const recent = JSON.parse(localStorage.getItem("lvce-recent-cities") ?? "[]") as string[];
        localStorage.setItem("lvce-recent-cities", JSON.stringify([guide.slug, ...recent.filter((slug) => slug !== guide.slug)].slice(0, 8)));
      } catch { /* 损坏的本地偏好不阻止城市页显示 */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [guide.defaultDays, guide.guideTypes, guide.routes, guide.slug]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(`lvce-city-form-${guide.slug}`, JSON.stringify({ guideType, days, travelMonth, startTime, endTime, pace, interests, mustHave, notInterested, earlyStart, longWalk, rainBackup })); } catch { /* 当前会话仍可继续编辑 */ }
  }, [days, earlyStart, endTime, guide.slug, guideType, interests, longWalk, mustHave, notInterested, pace, rainBackup, ready, startTime, travelMonth]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const syncPreferenceFromUrl = () => {
      const value = new URL(window.location.href).searchParams.get("preference");
      setActivePreference(value && ROUTE_PREFERENCES.includes(value as CityRoutePreference) ? value as CityRoutePreference : "全部");
    };
    window.addEventListener("popstate", syncPreferenceFromUrl);
    return () => window.removeEventListener("popstate", syncPreferenceFromUrl);
  }, []);

  useEffect(() => {
    const refreshPersonalItems = () => {
      setFavoritePlaces(storedItems("lvce-favorite-places"));
      setFavoriteRestaurants(storedItems("lvce-favorite-restaurants"));
      setUninterested(storedItems("lvce-not-interested"));
    };
    window.addEventListener("lvce-personal-travel-change", refreshPersonalItems);
    window.addEventListener("storage", refreshPersonalItems);
    return () => {
      window.removeEventListener("lvce-personal-travel-change", refreshPersonalItems);
      window.removeEventListener("storage", refreshPersonalItems);
    };
  }, []);

  useEffect(() => {
    const sections = SECTION_NAV.map(([id]) => document.getElementById(id)).filter((item): item is HTMLElement => Boolean(item));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-28% 0px -58%", threshold: [0.05, 0.25, 0.6] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [guide.slug]);

  function toggleInterest(item: string) {
    setInterests((current) => current.includes(item)
      ? current.filter((value) => value !== item)
      : current.length < 5 ? [...current, item] : current);
  }

  function chooseGuideType(type: string) {
    setGuideType(type);
    choosePreference(GUIDE_TYPE_PREFERENCE[type] ?? "全部");
    if (type === "周末两日路线") setDays(guide.routes[0].days);
  }

  function choosePreference(preference: "全部" | CityRoutePreference) {
    setActivePreference(preference);
    const url = new URL(window.location.href);
    if (preference === "全部") url.searchParams.delete("preference");
    else url.searchParams.set("preference", preference);
    url.hash = "";
    window.history.pushState({}, "", `${url.pathname}${url.search}`);
  }

  function applyRouteChange(
    next: EditorialDay[],
    message: string,
    target: { preference?: "全部" | CityRoutePreference; days?: number; guideType?: string } = {},
  ) {
    setUndoStack((current) => [...current.slice(-8), {
      itinerary: cloneDays(displayedDays), key: baseRouteKey, preference: activePreference, days, guideType, label: message,
    }]);
    const nextPreference = target.preference ?? activePreference;
    const nextDays = target.days ?? days;
    if (target.preference !== undefined) setActivePreference(nextPreference);
    if (target.days !== undefined) setDays(nextDays);
    if (target.guideType !== undefined) setGuideType(target.guideType);
    setCustomDays(cloneDays(next));
    setCustomDaysKey(`${guide.slug}:${nextPreference}:${nextDays}`);
    setLastChange(message);
    setToast(message);
  }

  function undoLastChange() {
    const snapshot = undoStack.at(-1);
    if (!snapshot) return;
    setActivePreference(snapshot.preference);
    setDays(snapshot.days);
    setGuideType(snapshot.guideType);
    setCustomDays(cloneDays(snapshot.itinerary));
    setCustomDaysKey(snapshot.key);
    setUndoStack((current) => current.slice(0, -1));
    const url = new URL(window.location.href);
    if (snapshot.preference === "全部") url.searchParams.delete("preference");
    else url.searchParams.set("preference", snapshot.preference);
    url.hash = "itinerary";
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setLastChange(`已撤销：${snapshot.label}`);
    setToast(`已撤销：${snapshot.label}`);
  }

  function generateGuide(event: FormEvent) {
    event.preventDefault();
    if (startTime >= endTime) {
      setToast("结束时间需要晚于开始时间");
      return;
    }
    const typePreference = GUIDE_TYPE_PREFERENCE[guideType] ?? "全部";
    const interestPreference = interests.find((item): item is CityRoutePreference => ROUTE_PREFERENCES.includes(item as CityRoutePreference));
    const nextPreference = typePreference === "第一次必去" && interestPreference ? interestPreference : typePreference;
    const profile = nextPreference === "全部" ? routeOption : guide.preferenceRoutes.find((item) => item.preference === nextPreference) ?? routeOption;
    const sourceDays = cloneDays(profile.itinerary.slice(0, days));
    const effectiveStart = !earlyStart && startTime < "09:30" ? "09:30" : startTime;
    const blockedFragments = notInterested.replace(/不想|不要|避开|必须/g, "").split(/[，,、；;\n]/).map((item) => item.trim()).filter((item) => item.length >= 2);
    let removed = 0;
    const next = sourceDays.map((day) => {
      let nodes = day.nodes.filter((node) => {
        const withinHours = !/^\d{2}:\d{2}$/.test(node.time) || (node.time >= effectiveStart && node.time <= endTime);
        const blocked = blockedFragments.some((item) => node.title.includes(item) || item.includes(node.title));
        if (!withinHours || blocked) removed += 1;
        return withinHours && !blocked;
      });
      if (pace === "轻松" && nodes.length > 3) {
        removed += nodes.length - 3;
        nodes = nodes.slice(0, 3);
      }
      if (!nodes.length) nodes = day.nodes.slice(0, 1);
      nodes = nodes.map((node, index) => ({
        ...node,
        time: index === 0 && /^\d{2}:\d{2}$/.test(node.time) ? effectiveStart : node.time,
        transportMode: longWalk ? node.transportMode : node.transportMode === "步行" ? "公共交通或短程打车" : node.transportMode,
        transportTime: longWalk ? node.transportTime : `${node.transportTime ?? "出发前核对"}；本次已降低连续步行优先级`,
      }));
      return {
        ...day,
        title: `${day.area}｜${pace}节奏`,
        summary: `${effectiveStart}—${endTime}可用；${pace === "轻松" ? "只保留三个主要节点" : pace === "紧凑" ? "保留完整主线但不追加无来源点位" : "保留主线并为用餐和换乘留缓冲"}。${day.summary}`,
        startTime: effectiveStart,
        endTime,
        pace,
        transportSummary: longWalk ? day.transportSummary : `减少连续长走；${day.transportSummary ?? profile.transportSummary}`,
        rainAlternative: rainBackup ? day.rainAlternative ?? guide.rainyPlans[0] : "本次未自动加入雨天备选；天气变化时可手动切换雨天版。",
        nodes,
      };
    });
    const requiredText = mustHave.replace(/一定要|必须|安排|想去/g, "").trim();
    const requiredExperience = requiredText ? guide.experiences.find((item) => requiredText.includes(item.name) || item.name.includes(requiredText)) : undefined;
    const requiredRestaurant = requiredText ? guide.restaurants.find((item) => requiredText.includes(item.name) || item.name.includes(requiredText)) : undefined;
    let added = 0;
    if (requiredExperience && !next.some((day) => day.nodes.some((node) => node.title.includes(requiredExperience.name)))) {
      next[0].nodes.push({ time: "可调整", title: requiredExperience.name, meta: `${requiredExperience.duration} · 用户指定必去`, detail: requiredExperience.why, connection: `加入DAY 01后仍留在${requiredExperience.area}方向；请根据住宿位置核对顺序。`, kind: "景点", duration: requiredExperience.duration, transportMode: "公共交通或短程打车", transportTime: "出发前按实际位置核对", booking: "出发前核对预约与开放安排", crowd: requiredExperience.pitfall, imageSubject: requiredExperience.name, pitfall: requiredExperience.pitfall, alternative: requiredExperience.alternative });
      added += 1;
    } else if (requiredRestaurant && !next.some((day) => day.nodes.some((node) => node.title.includes(requiredRestaurant.name)))) {
      next[0].nodes.push({ time: "用餐时段", title: `${requiredRestaurant.name}用餐`, meta: `${requiredRestaurant.identity} · 用户指定`, detail: `${requiredRestaurant.why} 建议点${requiredRestaurant.order.join("、")}。`, connection: `优先安排在${requiredRestaurant.area}路线当天，不为用餐跨城折返。`, kind: "午餐", duration: "约1—1.5小时", transportMode: "公共交通或短程打车", transportTime: "出发前按当天节点核对", booking: "用餐前确认营业与排队规则", crowd: requiredRestaurant.queue, imageSubject: requiredRestaurant.name, alternative: requiredRestaurant.alternative, sourceId: requiredRestaurant.sourceId });
      added += 1;
    }
    const unmatched = Boolean(requiredText && !requiredExperience && !requiredRestaurant);
    const message = `已按表单重算：${next.length}天、${next.reduce((sum, day) => sum + day.nodes.length, 0)}个节点${removed ? `，删减${removed}个` : ""}${added ? `，加入${added}个必选项` : ""}${unmatched ? "；有1项未在本城资料库匹配，未擅自加入" : ""}`;
    applyRouteChange(next, message, { preference: nextPreference, days, guideType });
    const url = new URL(window.location.href);
    if (nextPreference === "全部") url.searchParams.delete("preference"); else url.searchParams.set("preference", nextPreference);
    url.hash = "itinerary";
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setReady(true);
    window.setTimeout(() => routeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function toggleFavorite() {
    try {
      const favorites = JSON.parse(localStorage.getItem("lvce-favorite-cities") ?? "[]") as string[];
      const next = favorite ? favorites.filter((slug) => slug !== guide.slug) : [guide.slug, ...favorites.filter((slug) => slug !== guide.slug)];
      localStorage.setItem("lvce-favorite-cities", JSON.stringify(next));
      setFavorite(!favorite);
      notifyPersonalTravelChanged();
      setToast(favorite ? "已取消收藏" : `已收藏${guide.city}`);
    } catch {
      setToast("当前浏览器无法保存收藏");
    }
  }

  function moveDay(target: number) {
    if (draggedDay === null || draggedDay === target) return;
    const next = [...displayedDays];
    const [moved] = next.splice(draggedDay, 1);
    next.splice(target, 0, moved);
    applyRouteChange(next, "已调整逐日顺序；请留意预约日期是否需要同步变更");
    setDraggedDay(null);
  }

  function moveDayBy(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= displayedDays.length) return;
    const next = [...displayedDays];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    applyRouteChange(next, `已把DAY ${String(index + 1).padStart(2, "0")}向${direction < 0 ? "前" : "后"}移动`);
  }

  function regenerateDay(index: number) {
    const next = displayedDays.map((day, dayIndex) => {
      if (dayIndex !== index) return day;
      return {
        ...day,
        title: `${day.area}｜已换成低排队版本`,
        summary: `保留当天片区不跨区，把容易排队的节点换成已有替代。${day.summary}`,
        nodes: day.nodes.map((node) => node.alternative ? { ...node, title: node.alternative, imageSubject: node.alternative, detail: `原计划“${node.title}”客流或状态不合适时，使用同片区替代；出发前仍需核对开放安排。`, pitfall: undefined } : node),
      };
    });
    applyRouteChange(next, `DAY ${String(index + 1).padStart(2, "0")} 已按同片区替代局部重排`);
  }

  function simplifyRoute(mode: "half" | "rain" | "queue" | "tired") {
    const source = displayedDays;
    let next = cloneDays(source);
    if (mode === "half") next = [{ ...source[0], title: `${source[0].area}｜半日精简`, summary: "只保留最能代表片区的前三段，随时可以提前结束。", nodes: source[0].nodes.slice(0, 3) }];
    if (mode === "tired") next = source.map((day) => ({ ...day, pace: "轻松", summary: `低强度版：${day.summary}`, nodes: day.nodes.slice(0, 3) }));
    if (mode === "rain") next = source.map((day, index) => ({ ...day, title: `${day.area}｜雨天调整`, summary: guide.rainyPlans[index % guide.rainyPlans.length], nodes: day.nodes.map((node) => node.alternative ? { ...node, title: node.alternative, imageSubject: node.alternative, detail: `雨天用同片区替代，减少露天停留。${node.detail}` } : node) }));
    if (mode === "queue") next = source.map((day) => ({ ...day, summary: `少排队版：${day.summary}`, nodes: day.nodes.map((node) => node.alternative ? { ...node, title: node.alternative, imageSubject: node.alternative, detail: `优先使用同片区替代，避免为热门点等待过久。${node.detail}` } : node) }));
    applyRouteChange(next, { half: "已切换半日精简路线", rain: "已套用雨天备用路线", queue: "已优先使用少排队替代", tired: "已简化为低强度路线" }[mode]);
  }

  function removeNode(dayIndex: number, nodeIndex: number) {
    if (displayedDays[dayIndex].nodes.length <= 1) { setToast("每一天至少保留一个节点"); return; }
    const removed = displayedDays[dayIndex].nodes[nodeIndex];
    const next = displayedDays.map((day, index) => index === dayIndex ? { ...day, nodes: day.nodes.filter((_, itemIndex) => itemIndex !== nodeIndex), summary: `已删除“${removed.title}”。${day.summary}` } : day);
    applyRouteChange(next, `已从DAY ${String(dayIndex + 1).padStart(2, "0")}删除“${removed.title}”`);
  }

  function replaceNode(dayIndex: number, nodeIndex: number) {
    const current = displayedDays[dayIndex].nodes[nodeIndex];
    if (!current.alternative) { setToast("这个节点没有已核验的同片区替代，未自动编造"); return; }
    const replacement: ItineraryNode = { ...current, title: current.alternative, imageSubject: current.alternative, detail: `替换原节点“${current.title}”；使用攻略已有的同片区替代，开放与预约仍需出发前核对。`, alternative: current.title, pitfall: undefined };
    const next = displayedDays.map((day, index) => index === dayIndex ? { ...day, nodes: day.nodes.map((node, itemIndex) => itemIndex === nodeIndex ? replacement : node) } : day);
    applyRouteChange(next, `已把“${current.title}”替换为“${replacement.title}”`);
  }

  function savePersonalItem(key: "lvce-favorite-places" | "lvce-favorite-restaurants", name: string, kind: SavedTravelItem["kind"]) {
    const id = `${guide.slug}:${kind}:${name}`;
    const current = storedItems(key);
    const removing = current.some((item) => item.id === id);
    const next = removing ? current.filter((item) => item.id !== id) : [{ id, citySlug: guide.slug, city: guide.city, name, kind, addedAt: new Date().toISOString() }, ...current];
    try {
      localStorage.setItem(key, JSON.stringify(next));
      notifyPersonalTravelChanged();
      setToast(removing ? `已取消收藏${name}` : `已收藏${name}`);
    } catch { setToast("当前浏览器无法保存这条收藏"); }
  }

  function markNotInterested(name: string, kind: SavedTravelItem["kind"]) {
    const id = `${guide.slug}:${kind}:${name}`;
    try {
      const current = storedItems("lvce-not-interested");
      if (!current.some((item) => item.id === id)) localStorage.setItem("lvce-not-interested", JSON.stringify([{ id, citySlug: guide.slug, city: guide.city, name, kind, addedAt: new Date().toISOString() }, ...current]));
      notifyPersonalTravelChanged();
    } catch { setToast("当前浏览器无法保存不感兴趣记录"); return; }
    const changed = displayedDays.some((day) => day.nodes.some((node) => node.title.includes(name)));
    if (changed) {
      const next = displayedDays.map((day) => ({ ...day, nodes: day.nodes.filter((node) => !node.title.includes(name)) }));
      applyRouteChange(next.map((day, index) => day.nodes.length ? day : displayedDays[index]), `已降低“${name}”优先级，并从当前路线移除`);
    } else setToast(`已将“${name}”标记为不感兴趣`);
  }

  function addNodeToDay(name: string, kind: "地点" | "餐厅", dayIndex: number) {
    const target = Math.max(0, Math.min(dayIndex, displayedDays.length - 1));
    const experience = guide.experiences.find((item) => item.name === name);
    const restaurant = guide.restaurants.find((item) => item.name === name);
    const node: ItineraryNode | undefined = kind === "地点" && experience ? { time: "可调整", title: experience.name, meta: `${experience.duration} · 收藏加入`, detail: experience.why, connection: `加入DAY ${String(target + 1).padStart(2, "0")}后仍按${experience.area}片区核对顺序。`, kind: "体验", duration: experience.duration, transportMode: "公共交通或短程打车", transportTime: "按前后节点实际位置核对", booking: "出发前核对预约与开放", crowd: experience.pitfall, imageSubject: experience.name, pitfall: experience.pitfall, alternative: experience.alternative }
      : kind === "餐厅" && restaurant ? { time: "用餐时段", title: `${restaurant.name}用餐`, meta: `${restaurant.identity} · 收藏加入`, detail: `${restaurant.why} 建议点${restaurant.order.join("、")}。`, connection: `优先放在${restaurant.area}主线当天，若跨区则改用同类餐厅。`, kind: "午餐", duration: "约1—1.5小时", transportMode: "公共交通或短程打车", transportTime: "按前后节点实际位置核对", booking: "出发前确认营业与排队规则", crowd: restaurant.queue, imageSubject: restaurant.name, alternative: restaurant.alternative, sourceId: restaurant.sourceId } : undefined;
    if (!node) return;
    if (displayedDays[target].nodes.some((item) => item.title.includes(name))) { setToast(`DAY ${String(target + 1).padStart(2, "0")} 已经包含“${name}”`); return; }
    const next = displayedDays.map((day, index) => index === target ? { ...day, nodes: [...day.nodes, node], summary: `${day.summary} 已手动加入“${name}”。` } : day);
    applyRouteChange(next, `已把“${name}”加入DAY ${String(target + 1).padStart(2, "0")}`);
  }

  async function copyDay(day: EditorialDay, index: number) {
    const text = [`DAY ${String(index + 1).padStart(2, "0")}｜${day.title}`, day.summary, ...day.nodes.map((node) => `${node.time} ${node.title}｜${node.detail}`), `太累时先删：${day.remove}`].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setToast(`DAY ${String(index + 1).padStart(2, "0")} 已复制`);
    } catch {
      setToast("当前浏览器无法复制，请手动选择文字");
    }
  }

  function saveItinerary() {
    try {
      localStorage.setItem(`lvce-saved-itinerary-${guide.slug}`, JSON.stringify({
        city: guide.city,
        days: displayedDays.length,
        baseDays: days,
        guideType,
        preference: activePreference,
        travelMonth,
        pace,
        itinerary: displayedDays,
      }));
      setSavedPlan(true);
      notifyPersonalTravelChanged();
      setToast(`${guide.city}${displayedDays.length}日行程已保存在当前设备`);
    } catch {
      setToast("当前浏览器无法保存行程");
    }
  }

  function deleteItinerary() {
    try {
      localStorage.removeItem(`lvce-saved-itinerary-${guide.slug}`);
      setSavedPlan(false);
      setConfirmDeletePlan(false);
      notifyPersonalTravelChanged();
      setToast("已删除当前设备上的已保存行程");
    } catch {
      setToast("当前浏览器无法删除行程");
    }
  }

  function exportLongImage() {
    const canvas = document.createElement("canvas");
    const width = 1080;
    const height = 360 + displayedDays.reduce((total, day) => total + 150 + day.nodes.length * 72, 0);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#eeeae1";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#27302d";
    context.font = "56px serif";
    context.fillText(`${guide.city}${displayedDays.length}日旅行攻略`, 72, 100);
    context.font = "24px sans-serif";
    context.fillStyle = "#607068";
    context.fillText(`${travelMonth} · ${pace}节奏 · ${interests.slice(0, 3).join(" / ")}`, 72, 150);
    let y = 230;
    displayedDays.forEach((day, index) => {
      context.fillStyle = "#526b5f";
      context.font = "26px sans-serif";
      context.fillText(`DAY ${String(index + 1).padStart(2, "0")} · ${day.area}`, 72, y);
      y += 46;
      context.fillStyle = "#27302d";
      context.font = "34px serif";
      context.fillText(day.title.slice(0, 28), 72, y);
      y += 58;
      context.font = "21px sans-serif";
      day.nodes.forEach((node) => {
        context.fillText(`${node.time}  ${node.title}`.slice(0, 46), 92, y);
        y += 58;
      });
      y += 48;
    });
    const link = document.createElement("a");
    link.download = `${guide.slug}-trip-guide.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setToast("长图已导出到下载目录");
  }

  async function shareGuide() {
    try {
      const payload = encodeURIComponent(JSON.stringify({ version: 1, baseDays: days, guideType, preference: activePreference, travelMonth, pace, itinerary: displayedDays }));
      const url = new URL(window.location.href);
      url.hash = `route=${payload}`;
      await navigator.clipboard.writeText(url.toString());
      setToast(`${guide.city}当前路线链接已复制；节点、顺序与节奏可还原`);
    } catch {
      setToast("当前路线过长或浏览器无法复制，请先保存到当前设备");
    }
  }

  return (
    <main className="city-guide-page">
      <header className="site-header city-site-header">
        <Link className="brand" href="/" aria-label="旅策首页"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></Link>
        <nav aria-label="城市攻略导航"><a href="#topics">实用问题</a><a href="#planner">定路线</a><a href="#itinerary">逐日攻略</a><MyTravelDrawer onToast={setToast} /></nav>
      </header>

      <section className="city-cover">
        <CityMediaImage key={guide.image} src={guide.image} fallback={imageFallback} alt={guide.imageAlt} priority sizes="100vw" />
        <div className="city-cover-shade" />
        <div className="city-cover-copy">
          <Link href="/" className="back-link">← 返回城市列表</Link>
          <p className="eyebrow">{guide.eyebrow}</p>
          <span>{guide.province} · 建议{guide.routes[0].days}—{guide.routes.at(-1)?.days ?? guide.defaultDays}日 · {guide.recommendedSeasons.join(" / ")}</span>
          <h1>{guide.title}</h1>
          <p>{guide.intro}</p>
          <ul className="city-cover-tags">{guide.travelTags.slice(0, 5).map((tag) => <li key={tag}>{tag}</li>)}</ul>
          <div><a href="#planner">生成我的路线 ↘</a><a href="#itinerary">查看经典路线</a><button type="button" onClick={toggleFavorite}>{favorite ? "已收藏 ♥" : "收藏城市 ♡"}</button><button type="button" onClick={shareGuide}>分享 ↗</button></div>
        </div>
      </section>

      <div className="credibility-strip" aria-label="内容可信度说明">
        {guide.sources.some((source) => source.official) && <span>官方信息 · 核验于{formatChinaDate(guide.editedAt)}</span>}
        {(guide.research?.xiaohongshu.length ?? 0) >= 3 && <span>多篇公开攻略共同提及</span>}
        {(guide.research?.xiaohongshu.length ?? 0) > 0 && <span>近期游客经验</span>}
        <span>开放与预约建议出发前确认</span>
      </div>

      <nav className="city-section-nav" aria-label="城市攻略章节">
        {SECTION_NAV.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined}>{label}</a>)}
      </nav>

      <section className="city-fit" id="overview">
        <div><span>01 · HOW TO TRAVEL</span><h2>这座城市适合怎样旅行</h2></div>
        <div><p>{guide.fit}</p><p className="lodging-advice">{guide.stayAdvice}</p></div>
      </section>

      <section className="first-visit-section" aria-labelledby="first-visit-heading">
        <div className="first-visit-heading"><span>FIRST VISIT DECISIONS</span><h2 id="first-visit-heading">第一次来，先做这几个决定</h2><p>先判断时间花在哪里，再开始排每天的节点。</p></div>
        <div className="first-visit-snapshot">
          <article><span>先保留</span><h3>{guide.experiences[0].name}</h3><p>{guide.experiences[0].why}</p><small>{guide.experiences[0].area} · {guide.experiences[0].duration}</small></article>
          <article><span>最容易犯的错</span><h3>{guide.firstTimerMistakes[0]}</h3><p>{guide.firstTimerMistakes[1]}</p><small>先按片区做减法</small></article>
          <article><span>时间不够可以删</span><h3>{guide.decisions.find((item) => item.verdict !== "值得去")?.name ?? guide.experiences.at(-1)?.name}</h3><p>{guide.decisions.find((item) => item.verdict !== "值得去")?.why ?? "把它留给下一次，不为打卡跨区折返。"}</p><small>替代：{guide.decisions.find((item) => item.verdict !== "值得去")?.alternative ?? guide.experiences[0].alternative}</small></article>
        </div>
        <div className="city-story-images">
          {storyImages.map((image) => <figure key={image.src}><CityMediaImage src={image.src} fallback={imageFallback} alt={image.alt} sizes="(max-width: 760px) 100vw, 50vw" /><figcaption>{image.alt}</figcaption></figure>)}
        </div>
      </section>

      <section className="topic-section" id="topics">
        <div className="content-heading"><div><span>02 · REAL QUESTIONS</span><h2>旅行者真正会遇到的问题</h2></div><p>不是“必去榜单”，而是能直接影响路线取舍的结论。</p></div>
        <div className="practical-guide-grid">
          {guide.themes.map((item) => <article key={item.title}>
            <div><span>{item.audience}</span><em>{item.duration}</em></div>
            <h3>{item.title}</h3>
            <p>{item.advice}</p>
            <dl><div><dt>避坑</dt><dd>{item.pitfall}</dd></div><div><dt>替代</dt><dd>{item.alternative}</dd></div></dl>
            <small>内容更新于{formatChinaDate(guide.editedAt)}</small>
          </article>)}
        </div>
        <div className="preference-browser" aria-label="按旅行偏好筛选城市内容">
          <div className="interest-filter city-interest-filter">
            {(["全部", ...ROUTE_PREFERENCES] as const).map((item) => <button type="button" key={item} className={activePreference === item ? "active" : ""} onClick={() => choosePreference(item)}>{item}</button>)}
          </div>
          <div className="preference-result-heading"><div><span>按偏好即时整理</span><h3>{activePreference === "全部" ? `${guide.city}完整旅行内容` : preferenceRoute?.title}</h3></div><p>{activePreference === "全部" ? "景点、餐厅、街区与体验一起展示。" : preferenceRoute?.summary}</p></div>
          <div className="preference-content-grid">{filteredPreferenceContent.map((item) => <article key={item.id}><span>{item.kind}</span><h4>{item.title}</h4><p>{item.summary}</p></article>)}</div>
        </div>
        <div className="experience-directory">
          <div><span>PLACES WITH A REASON</span><h3>{activePreference === "全部" ? `${guide.city}值得留时间的地方` : `${activePreference}怎么选地点`}</h3></div>
          <div>{visibleExperiences.map((experience) => {
            const media = imageFor("poi", experience.name);
            const id = `${guide.slug}:地点:${experience.name}`;
            const expanded = expandedCards.includes(id);
            const saved = favoritePlaces.some((item) => item.id === id);
            const targetDay = Math.min(cardDayTargets[id] ?? 0, displayedDays.length - 1);
            return <article key={experience.name} className={expanded ? "content-card-expanded" : ""}>{media && <figure className="experience-photo"><CityMediaImage src={media.src} fallback={imageFallback} alt={media.alt} sizes="(max-width: 760px) 100vw, 32vw" /></figure>}<header><h4>{experience.name}</h4><span>{experience.area}</span></header><p>{experience.why}</p>
              {expanded && <dl><div><dt>建议时长</dt><dd>{experience.duration}</dd></div><div><dt>适合时间</dt><dd>{experience.bestTime}</dd></div><div><dt>避坑</dt><dd>{experience.pitfall}</dd></div><div><dt>替代</dt><dd>{experience.alternative}</dd></div></dl>}
              <div className="content-card-actions"><button type="button" aria-expanded={expanded} onClick={() => setExpandedCards((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}>{expanded ? "收起细节" : "展开细节"}</button><button type="button" aria-pressed={saved} onClick={() => savePersonalItem("lvce-favorite-places", experience.name, "地点")}>{saved ? "已收藏" : "收藏地点"}</button><label><span>加入</span><select aria-label={`把${experience.name}加入哪一天`} value={targetDay} onChange={(event) => setCardDayTargets((current) => ({ ...current, [id]: Number(event.target.value) }))}>{displayedDays.map((_, index) => <option value={index} key={index}>DAY {String(index + 1).padStart(2, "0")}</option>)}</select></label><button type="button" onClick={() => addNodeToDay(experience.name, "地点", targetDay)}>加入路线</button><button type="button" onClick={() => markNotInterested(experience.name, "地点")}>不感兴趣</button><button type="button" aria-expanded={nearbyCard === id} onClick={() => setNearbyCard(nearbyCard === id ? "" : id)}>附近怎么排</button></div>
              {nearbyCard === id && <div className="nearby-note"><b>同片区一起安排</b><p>优先和{guide.neighborhoods.find((item) => experience.area.includes(item.name) || item.name.includes(experience.area))?.name ?? experience.area}的项目连走；若客流或天气不合适，改为{experience.alternative}，不要为单个点跨区。</p></div>}
            </article>;
          })}</div>
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
          <fieldset><legend>旅行天数</legend><div className="route-option-list">{guide.routes.map((option) => <button type="button" key={option.days} className={days === option.days && activePreference === "全部" ? "active" : ""} onClick={() => { setDays(option.days); setGuideType("第一次经典路线"); choosePreference("全部"); setLastChange(`已切换为${option.days}日经典基础路线`); }}><b>{option.label}</b><span>{option.areas.slice(0, option.days).map((area, index) => `D${index + 1} ${area}`).join(" · ")}</span></button>)}</div></fieldset>
          <div className="form-row three">
            <label><span>目的地</span><input value={guide.city} readOnly aria-readonly="true" /></label>
            <label><span>出行月份</span><select value={travelMonth} onChange={(event) => setTravelMonth(event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1}>{index + 1}月</option>)}</select></label>
            <label><span>每天愿意走多满</span><select value={pace} onChange={(event) => setPace(event.target.value as typeof pace)}><option>轻松</option><option>正常</option><option>紧凑</option></select></label>
          </div>
          <div className="form-row two">
            <label><span>每天开始时间</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label><span>每天结束时间</span><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
          </div>
          <fieldset className="interest-box"><legend>这次旅行你更在意什么？ <small>最多5项</small></legend><div>{TRAVEL_INTERESTS.map((item) => <button type="button" key={item} className={interests.includes(item) ? "active" : ""} onClick={() => toggleInterest(item)}><span>{interests.includes(item) ? "✓" : "+"}</span>{item}</button>)}</div></fieldset>
          <div className="form-row two planner-textareas">
            <label className="constraints"><span>必须安排 <small>选填</small></span><textarea value={mustHave} onChange={(event) => setMustHave(event.target.value)} maxLength={180} placeholder={`例如：一定要去${guide.experiences[0].name}`} /></label>
            <label className="constraints"><span>不感兴趣或必须避开 <small>选填</small></span><textarea value={notInterested} onChange={(event) => setNotInterested(event.target.value)} maxLength={180} placeholder="例如：不早起、不排网红长队、不要连续长距离步行" /></label>
          </div>
          <fieldset className="planner-switches"><legend>行程边界</legend><div><label><input type="checkbox" checked={earlyStart} onChange={(event) => setEarlyStart(event.target.checked)} /><span>可以早起</span></label><label><input type="checkbox" checked={longWalk} onChange={(event) => setLongWalk(event.target.checked)} /><span>接受长距离步行</span></label><label><input type="checkbox" checked={rainBackup} onChange={(event) => setRainBackup(event.target.checked)} /><span>自动保留雨天备选</span></label></div></fieldset>
          <div className="planner-submit editorial-submit"><div><span>本次取舍</span><p>{guideType} · {days}天 · {pace} · {interests.slice(0, 3).join("、")}</p></div><button type="submit">整理这份攻略 <span>✦</span></button></div>
        </form>
      </section>

      <section className="editorial-itinerary" id="itinerary" ref={routeRef}>
        <div className="route-edition-head">
          <div><span>03 · YOUR MAIN ROUTE</span><h2>{preferenceRoute?.title.replace("4日", `${displayedDays.length}日`) ?? `${guide.city}${displayedDays.length}日｜${guideType}`}</h2><p>{displayedDays.map((day, index) => `D${index + 1} ${day.area}`).join(" · ")}</p></div>
          <div><b>{displayedDays[0]?.pace ?? pace}节奏</b><span>{travelMonth} · 当前 {displayedDays[0]?.startTime ?? startTime}—{displayedDays[0]?.endTime ?? endTime}</span><small>{displayedDays[0]?.transportSummary ?? activeRouteProfile.transportSummary}</small></div>
        </div>

        <div className="itinerary-tools" aria-label="行程快捷调整">
          <button type="button" onClick={() => simplifyRoute("half")}>半日版</button>
          <button type="button" onClick={() => simplifyRoute("rain")}>雨天版</button>
          <button type="button" onClick={() => simplifyRoute("queue")}>少排队</button>
          <button type="button" onClick={() => simplifyRoute("tired")}>太累了，简化</button>
          <button type="button" onClick={() => applyRouteChange(baseDisplayedDays, "已恢复当前天数与偏好的基础路线")}>恢复基础路线</button>
          <button type="button" disabled={!undoStack.length} onClick={undoLastChange}>撤销上一步</button>
          <button type="button" onClick={saveItinerary}>{savedPlan ? "更新已保存行程" : "保存完整行程"}</button>
          {savedPlan && <button type="button" onClick={() => setConfirmDeletePlan(true)}>删除已保存行程</button>}
          <button type="button" onClick={exportLongImage}>导出长图</button>
          <button type="button" onClick={shareGuide}>分享当前路线</button>
        </div>
        {lastChange && <div className="route-change-feedback" role="status"><span>最近调整</span><p>{lastChange}</p>{undoStack.length > 0 && <button type="button" onClick={undoLastChange}>撤销</button>}</div>}

        <nav className="day-jump" aria-label="逐日攻略跳转">{displayedDays.map((day, index) => <a href={`#${guide.slug}-day-${index + 1}`} key={`${day.label}-${day.title}-${index}`}><span>DAY {String(index + 1).padStart(2, "0")}</span><b>{day.area}</b></a>)}</nav>

        <div className="editorial-day-list">
          {displayedDays.map((day, dayIndex) => <article className="editorial-day" id={`${guide.slug}-day-${dayIndex + 1}`} key={`${day.label}-${day.title}`} draggable={displayedDays.length > 1} onDragStart={() => setDraggedDay(dayIndex)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveDay(dayIndex)}>
            <header><div><span>DAY {String(dayIndex + 1).padStart(2, "0")} · {day.area}</span><h2>{day.title}</h2><p>{day.summary}</p></div><div className="day-actions"><em>{day.nodes.length} 个节点</em><button type="button" onClick={() => regenerateDay(dayIndex)}>按替代重排</button><button type="button" onClick={() => copyDay(day, dayIndex)}>复制当天</button>{displayedDays.length > 1 && <div className="day-order-buttons"><button type="button" disabled={dayIndex === 0} onClick={() => moveDayBy(dayIndex, -1)}>前移</button><button type="button" disabled={dayIndex === displayedDays.length - 1} onClick={() => moveDayBy(dayIndex, 1)}>后移</button></div>}{displayedDays.length > 1 && <small>桌面端也可拖动整天排序</small>}</div></header>
            <dl className="day-operating-brief">
              <div><dt>时间</dt><dd>{day.startTime ?? startTime}—{day.endTime ?? endTime}</dd></div>
              <div><dt>强度</dt><dd>{day.pace ?? pace}</dd></div>
              <div><dt>交通</dt><dd>{day.transportSummary ?? activeRouteProfile.transportSummary}</dd></div>
              <div><dt>早起</dt><dd>{day.earlyStart ?? "按首个节点开放时间出发"}</dd></div>
              <div><dt>预约</dt><dd>{day.bookingItems?.length ? day.bookingItems.join("、") : "没有已确认的强制预约项；出发前仍需核对"}</dd></div>
            </dl>
            <div className="editorial-timeline">{day.nodes.map((node, nodeIndex) => {
              const source = getGuideSource(guide, node.sourceId);
              const media = imageForNode(dayIndex + nodeIndex, node.title, node.imageSubject);
              return <section key={`${node.time}-${node.title}`}>
                <div className="editorial-time"><time>{node.time}</time><span>{String(nodeIndex + 1).padStart(2, "0")}</span></div>
                <div className="editorial-stop">{media && <figure className="timeline-node-photo"><CityMediaImage src={media.src} fallback={imageFallback} alt={media.alt} sizes="(max-width: 760px) 100vw, 30vw" /></figure>}<div><h3>{node.title}</h3><em>{node.meta}</em></div><p>{node.detail}</p><dl className="node-facts"><div><dt>停留</dt><dd>{node.duration ?? node.meta}</dd></div><div><dt>交通</dt><dd>{node.transportMode ?? "步行或公共交通"} · {node.transportTime ?? "出发前核对"}</dd></div><div><dt>预约</dt><dd>{node.booking ?? "出发前核对"}</dd></div><div><dt>拥挤</dt><dd>{node.crowd ?? node.pitfall ?? "节假日错峰"}</dd></div></dl><p className="connection"><b>怎么衔接：</b>{node.connection}</p>{node.pitfall && <p className="micro-tip"><b>容易踩坑：</b>{node.pitfall}</p>}{node.alternative && <p className="micro-alternative"><b>替代方案：</b>{node.alternative}</p>}<SourceMark source={source} label={node.factLabel} /><div className="node-actions"><button type="button" onClick={() => replaceNode(dayIndex, nodeIndex)} disabled={!node.alternative}>替换节点</button><button type="button" onClick={() => removeNode(dayIndex, nodeIndex)}>删除节点</button></div></div>
              </section>;
            })}</div>
            <footer className="day-adjustments"><div><span>为什么这样走</span><p>{day.reason}</p></div><div><span>太累时先删</span><p>{day.remove}</p></div><div><span>排队严重时换</span><p>{day.queueAlternative ?? "使用节点中的同片区替代，不为热门点跨区。"}</p></div><div><span>下雨时换</span><p>{day.rainAlternative ?? guide.rainyPlans[dayIndex % guide.rainyPlans.length]}</p></div><div><span>不想早起如何调整</span><p>{day.lateStartAdjustment ?? "把上午次要节点移除，保留午餐后的主线。"}</p></div></footer>
          </article>)}
        </div>
      </section>

      <section className="restaurant-section" id="restaurants">
        <div className="content-heading"><div><span>04 · RESTAURANTS IN THE ROUTE</span><h2>餐厅必须放进具体一天</h2></div><p>店名不是孤立清单。先解释为什么值得，再说明排队时怎么换。</p></div>
        <div className="editorial-restaurants">{displayedRestaurants.map((item) => {
          const source = getGuideSource(guide, item.sourceId);
          const priceSource = getGuideSource(guide, item.priceSourceId);
          const media = imageFor("restaurant", item.name);
          const id = `${guide.slug}:餐厅:${item.name}`;
          const expanded = expandedCards.includes(id);
          const saved = favoriteRestaurants.some((savedItem) => savedItem.id === id);
          const targetDay = Math.min(cardDayTargets[id] ?? Math.max(0, displayedDays.findIndex((day) => day.nodes.some((node) => node.title.includes(item.name)))), displayedDays.length - 1);
          return <article key={item.name} className={expanded ? "content-card-expanded" : ""}>
            {media && <figure className="restaurant-photo"><CityMediaImage src={media.src} fallback={imageFallback} alt={media.alt} sizes="(max-width: 760px) 100vw, 38vw" /></figure>}
            <header><div><span>{item.identity}</span><h3>{item.name}</h3></div><em>{item.plannedFor}</em></header>
            <p>{item.why}</p>
            {expanded && <dl><div><dt>建议点</dt><dd>{item.order.join(" · ")}</dd></div><div><dt>不建议</dt><dd>{item.avoid}</dd></div><div><dt>所在片区</dt><dd>{item.area}</dd></div><div><dt>是否值得排队</dt><dd>{item.queue}</dd></div><div><dt>排队替代</dt><dd>{item.alternative}</dd></div>{item.price && priceSource && <div><dt>人均参考</dt><dd>{item.price}<SourceMark source={priceSource} /></dd></div>}</dl>}
            <div className="content-card-actions"><button type="button" aria-expanded={expanded} onClick={() => setExpandedCards((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])}>{expanded ? "收起细节" : "展开点菜与避坑"}</button><button type="button" aria-pressed={saved} onClick={() => savePersonalItem("lvce-favorite-restaurants", item.name, "餐厅")}>{saved ? "已收藏" : "收藏餐厅"}</button><label><span>加入</span><select aria-label={`把${item.name}加入哪一天`} value={targetDay} onChange={(event) => setCardDayTargets((current) => ({ ...current, [id]: Number(event.target.value) }))}>{displayedDays.map((_, index) => <option value={index} key={index}>DAY {String(index + 1).padStart(2, "0")}</option>)}</select></label><button type="button" onClick={() => addNodeToDay(item.name, "餐厅", targetDay)}>加入路线</button><button type="button" onClick={() => markNotInterested(item.name, "餐厅")}>不感兴趣</button><button type="button" aria-expanded={nearbyCard === id} onClick={() => setNearbyCard(nearbyCard === id ? "" : id)}>排队替代</button></div>
            {nearbyCard === id && <div className="nearby-note"><b>不值得久等时</b><p>{item.queue} 替代：{item.alternative}。保留{item.order[0]}这类代表菜，不为单店改变整天动线。</p></div>}
            <SourceMark source={source} label="查看餐厅资料" />
          </article>;
        })}</div>
      </section>

      <section className="food-section" id="foods">
        <div className="content-heading"><div><span>05 · WHAT TO ORDER</span><h2>代表美食和具体点菜建议</h2></div><p>不制造无依据的人均价格；先告诉你怎么点、放在哪一餐。</p></div>
        <div className="food-notes">{displayedFoods.map((food, index) => {
          const media = imageFor("food", food.name);
          return <article key={`${food.name}-${index}`}>{media && <figure className="food-photo"><CityMediaImage src={media.src} fallback={imageFallback} alt={media.alt} sizes="(max-width: 760px) 100vw, 25vw" /></figure>}<span>{String(index + 1).padStart(2, "0")}</span><h3>{food.name}</h3><b>{food.when}</b><p>{food.order}</p><small>{food.note}</small></article>;
        })}</div>
      </section>

      <section className="decision-section" id="practical">
        <div className="content-heading"><div><span>06 · KEEP OR SKIP</span><h2>值得去与可以放弃</h2></div><p>不把每个景点都包装成“必去”。</p></div>
        <div className="decision-list">{guide.decisions.map((item) => <article key={item.name}><span className={`verdict verdict-${item.verdict}`}>{item.verdict}</span><h3>{item.name}</h3><p>{item.why}</p><small>替代：{item.alternative}</small></article>)}</div>
      </section>

      <section className="situation-section">
        <div><span>07 · WHEN THINGS CHANGE</span><h2>下雨、节假日和特殊情况</h2></div>
        <div>{guide.situations.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.advice}</p></article>)}</div>
      </section>

      <section className="pre-departure editorial-checklist"><div><span>08 · BEFORE YOU GO</span><h2>出发前完成</h2></div><ul>{guide.checklist.map((item) => <li key={item}><span aria-hidden="true">□</span>{item}</li>)}</ul></section>

      <div id="sources" className="source-anchor"><details className="source-details editorial-sources"><summary>查看图片与资料来源 <span>{guide.sources.length + guide.images.filter((image) => image.sourcePage).length} 条</span></summary><div>
        {guide.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><span>{source.category}{source.official ? " · 官方信息" : ""}</span><b>{source.title}</b><small>{source.siteName} · 核验于{formatChinaDate(source.checkedAt)} ↗</small></a>)}
        {guide.images.filter((image) => image.sourcePage).map((image) => <a href={image.sourcePage} target="_blank" rel="noreferrer" key={image.creditId}><span>图片 · {image.license}</span><b>{image.alt}</b><small>{image.sourcePlatform} · {image.author || "来源页署名"} ↗</small></a>)}
      </div></details></div>
      <p className="verification-line">预约、开放与收费信息可能调整；动态事实以对应官方页面为准。主观建议为多来源交叉后的编辑整理，不代表单篇旅行笔记。</p>

      <footer className="city-footer"><Link className="brand" href="/"><span>旅</span><div><b>旅策</b><small>ROUTE &amp; TASTE</small></div></Link><p>{guide.city}实用旅行专刊 · 路线、餐厅与取舍一次整理清楚</p><small>© 2026 旅策</small></footer>
      {confirmDeletePlan && <div className="confirm-layer" role="presentation"><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-plan-title"><span>删除确认</span><h3 id="delete-plan-title">确认删除当前设备上的“{guide.city}{displayedDays.length}日”已保存行程？</h3><p>屏幕上的路线不会立即消失，但刷新后不再自动恢复。</p><div><button type="button" onClick={() => setConfirmDeletePlan(false)}>取消</button><button type="button" onClick={deleteItinerary}>确认删除</button></div></div></div>}
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
