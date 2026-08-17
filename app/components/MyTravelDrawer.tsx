"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PUBLISHED_CITY_GUIDES } from "@/content/cities";

export const PERSONAL_TRAVEL_EVENT = "lvce-personal-travel-change";

export type SavedTravelItem = {
  id: string;
  citySlug: string;
  city: string;
  name: string;
  kind: "地点" | "餐厅";
  addedAt?: string;
};

type SavedRoute = {
  storageKey: string;
  slug: string;
  city: string;
  days: number;
  guideType?: string;
  preference?: string;
};

type Snapshot = {
  favoriteCities: string[];
  recentCities: string[];
  places: SavedTravelItem[];
  restaurants: SavedTravelItem[];
  routes: SavedRoute[];
  uninterested: SavedTravelItem[];
};

const EMPTY: Snapshot = { favoriteCities: [], recentCities: [], places: [], restaurants: [], routes: [], uninterested: [] };

function readArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readSnapshot(): Snapshot {
  const routes: SavedRoute[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index);
    if (!storageKey?.startsWith("lvce-saved-itinerary-")) continue;
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Partial<SavedRoute>;
      const slug = storageKey.replace("lvce-saved-itinerary-", "");
      const guide = PUBLISHED_CITY_GUIDES.find((item) => item.slug === slug);
      routes.push({ storageKey, slug, city: value.city ?? guide?.city ?? slug, days: Number(value.days) || 0, guideType: value.guideType, preference: value.preference });
    } catch { /* 单条损坏记录不影响其他本地内容 */ }
  }
  return {
    favoriteCities: readArray<string>("lvce-favorite-cities"),
    recentCities: readArray<string>("lvce-recent-cities"),
    places: readArray<SavedTravelItem>("lvce-favorite-places"),
    restaurants: readArray<SavedTravelItem>("lvce-favorite-restaurants"),
    uninterested: readArray<SavedTravelItem>("lvce-not-interested"),
    routes,
  };
}

export function notifyPersonalTravelChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PERSONAL_TRAVEL_EVENT));
}

export default function MyTravelDrawer({ onToast }: { onToast?: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [confirmation, setConfirmation] = useState<{ message: string; action: () => void } | null>(null);

  const refresh = useCallback(() => {
    try { setSnapshot(readSnapshot()); } catch { setSnapshot(EMPTY); }
  }, []);

  useEffect(() => {
    const sync = () => refresh();
    window.addEventListener("storage", sync);
    window.addEventListener(PERSONAL_TRAVEL_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PERSONAL_TRAVEL_EVENT, sync);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, refresh]);

  const removeArrayItem = (key: string, id: string, label: string) => {
    const next = readArray<SavedTravelItem>(key).filter((item) => item.id !== id);
    localStorage.setItem(key, JSON.stringify(next));
    notifyPersonalTravelChanged();
    onToast?.(`已从我的旅行移除${label}`);
  };

  const removeRoute = (route: SavedRoute) => setConfirmation({
    message: `确认删除“${route.city}${route.days || ""}日”已保存行程？此操作只影响当前设备。`,
    action: () => {
      localStorage.removeItem(route.storageKey);
      notifyPersonalTravelChanged();
      onToast?.(`已删除${route.city}的已保存行程`);
    },
  });

  const clearAll = () => setConfirmation({
    message: "确认清空所有收藏、已保存行程、最近浏览和不感兴趣记录？城市筛选设置会保留。",
    action: () => {
      ["lvce-favorite-cities", "lvce-recent-cities", "lvce-favorite-places", "lvce-favorite-restaurants", "lvce-not-interested"].forEach((key) => localStorage.removeItem(key));
      const savedKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key?.startsWith("lvce-saved-itinerary-")));
      savedKeys.forEach((key) => localStorage.removeItem(key));
      notifyPersonalTravelChanged();
      onToast?.("已清空当前设备上的我的旅行记录");
    },
  });

  const cityLinks = (slugs: string[]) => slugs
    .map((slug) => PUBLISHED_CITY_GUIDES.find((guide) => guide.slug === slug))
    .filter((guide): guide is (typeof PUBLISHED_CITY_GUIDES)[number] => Boolean(guide));
  const total = snapshot.favoriteCities.length + snapshot.places.length + snapshot.restaurants.length + snapshot.routes.length;

  return (
    <>
      <button className="my-travel-trigger" type="button" onClick={() => { refresh(); setOpen(true); }}>我的旅行{total ? ` ${total}` : ""}</button>
      {open && <div className="drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <aside className="my-travel-drawer" role="dialog" aria-modal="true" aria-labelledby="my-travel-title">
          <header><div><span>LOCAL TRAVEL DESK</span><h2 id="my-travel-title">我的旅行</h2><p>所有内容只保存在当前设备，不要求登录。</p></div><button type="button" aria-label="关闭我的旅行" onClick={() => setOpen(false)}>×</button></header>
          <div className="my-travel-sections">
            <section><h3>收藏城市 <span>{snapshot.favoriteCities.length}</span></h3>{snapshot.favoriteCities.length ? <nav>{cityLinks(snapshot.favoriteCities).map((guide) => <Link key={guide.slug} href={`/city/${guide.slug}`} onClick={() => setOpen(false)}>{guide.city}<span>查看攻略 ↗</span></Link>)}</nav> : <p>还没有收藏城市。</p>}</section>
            <section><h3>已保存行程 <span>{snapshot.routes.length}</span></h3>{snapshot.routes.length ? <div className="saved-travel-list">{snapshot.routes.map((route) => <article key={route.storageKey}><Link href={`/city/${route.slug}#itinerary`} onClick={() => setOpen(false)}><b>{route.city}{route.days ? `${route.days}日` : ""}</b><small>{route.preference && route.preference !== "全部" ? route.preference : route.guideType ?? "自定义路线"}</small></Link><button type="button" onClick={() => removeRoute(route)}>删除</button></article>)}</div> : <p>在城市页整理并保存后会出现在这里。</p>}</section>
            <section><h3>收藏地点 <span>{snapshot.places.length}</span></h3>{snapshot.places.length ? <div className="saved-travel-list">{snapshot.places.map((item) => <article key={item.id}><Link href={`/city/${item.citySlug}#topics`} onClick={() => setOpen(false)}><b>{item.name}</b><small>{item.city} · 地点</small></Link><button type="button" onClick={() => removeArrayItem("lvce-favorite-places", item.id, item.name)}>移除</button></article>)}</div> : <p>城市页的地点卡片可以直接收藏。</p>}</section>
            <section><h3>收藏餐厅 <span>{snapshot.restaurants.length}</span></h3>{snapshot.restaurants.length ? <div className="saved-travel-list">{snapshot.restaurants.map((item) => <article key={item.id}><Link href={`/city/${item.citySlug}#restaurants`} onClick={() => setOpen(false)}><b>{item.name}</b><small>{item.city} · 餐厅</small></Link><button type="button" onClick={() => removeArrayItem("lvce-favorite-restaurants", item.id, item.name)}>移除</button></article>)}</div> : <p>城市页的餐厅卡片可以直接收藏。</p>}</section>
            <section><h3>最近浏览 <span>{snapshot.recentCities.length}</span></h3>{snapshot.recentCities.length ? <nav>{cityLinks(snapshot.recentCities).map((guide) => <Link key={guide.slug} href={`/city/${guide.slug}`} onClick={() => setOpen(false)}>{guide.city}<span>继续查看 ↗</span></Link>)}</nav> : <p>暂时没有浏览记录。</p>}</section>
            {snapshot.uninterested.length > 0 && <section><h3>不感兴趣 <span>{snapshot.uninterested.length}</span></h3><div className="saved-travel-list">{snapshot.uninterested.map((item) => <article key={item.id}><div><b>{item.name}</b><small>{item.city} · 将降低展示优先级</small></div><button type="button" onClick={() => removeArrayItem("lvce-not-interested", item.id, item.name)}>恢复</button></article>)}</div></section>}
          </div>
          <footer><button type="button" onClick={clearAll} disabled={!total && !snapshot.recentCities.length && !snapshot.uninterested.length}>清空我的旅行记录</button><button type="button" onClick={() => setOpen(false)}>完成</button></footer>
        </aside>
      </div>}
      {confirmation && <div className="confirm-layer" role="presentation"><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><span>需要确认</span><h3 id="confirm-title">{confirmation.message}</h3><div><button type="button" onClick={() => setConfirmation(null)}>取消</button><button type="button" onClick={() => { confirmation.action(); setConfirmation(null); refresh(); }}>确认删除</button></div></div></div>}
    </>
  );
}
