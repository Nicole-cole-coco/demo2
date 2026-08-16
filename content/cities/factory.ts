import { CITY_PROFILES } from "@/lib/cities";
import { getCityKnowledge } from "@/lib/city-knowledge";
import {
  EDITORIAL_GUIDE_TYPES,
  type EditorialCityGuide,
  type EditorialDay,
  type GuideSource,
} from "@/lib/editorial-city-guides";
import type {
  CityGuideSeed,
  CityPreference,
  CityRouteEdition,
  CompleteCityGuide,
  PreferenceContentItem,
  PreferenceRoute,
} from "./types";

export const CONTENT_CHECKED_AT = "2026-08-09T00:00:00+08:00";

const routePatterns: Record<2 | 3 | 4, number[][]> = {
  2: [[0, 1], [2, 3]],
  3: [[0, 1], [2, 3], [4, 5]],
  4: [[0], [1, 2], [3, 4], [5]],
};

type RouteActivity = CityGuideSeed["experiences"][number] & {
  kind: "景点" | "街区" | "博物馆" | "自然" | "体验";
};

const preferenceSequences: Record<CityPreference, number[]> = {
  第一次必去: [0, 1, 2, 3, 4, 5, 0, 2],
  地道美食: [3, 0, 4, 1, 5, 2, 3, 4],
  标志性餐厅: [1, 3, 0, 4, 2, 5, 1, 4],
  少排队: [5, 4, 3, 2, 1, 0, 5, 3],
  少折返: [0, 1, 2, 3, 4, 5, 0, 1],
  城市漫游: [3, 4, 1, 5, 0, 2, 3, 5],
  建筑摄影: [1, 0, 5, 4, 2, 3, 1, 5],
  博物馆: [0, 1, 2, 0, 1, 2, 0, 2],
  自然风景: [0, 1, 2, 0, 1, 2, 0, 2],
  夜生活: [3, 1, 4, 0, 5, 2, 3, 4],
  松弛休息: [4, 3, 5, 1, 0, 2, 4, 5],
  小众体验: [5, 4, 3, 1, 2, 0, 5, 4],
};

const typeNotes: Record<string, string> = {
  第一次经典路线: "保留最有城市辨识度的片区，但不为了打卡数量跨区折返。",
  本地吃喝路线: "每一顿都放回当天片区，优先地方经典与长期经营餐厅。",
  城市漫游路线: "减少大景点数量，把时间留给连续街区、市场和城市日常。",
  拍照建筑路线: "把室外建筑放在早晚，正午安排室内、用餐或休息。",
  博物馆路线: "每天最多一座主要博物馆，并预留预约失败后的同片区替代。",
  周末两日路线: "只保留两条最有代表性的片区线，不把远郊和市区硬塞在同一天。",
  松弛休息路线: "每天只设一个主目标，晚间活动默认可以取消。",
  亲子路线: "减少连续步行和排队，把需要早到的项目放在第一段。",
  雨天备用路线: "优先有完整室内体验的展馆、市场与餐饮片区。",
};

function slugFromImage(image: string) {
  return image.split("/").at(-1)?.replace(/\.[a-z0-9]+$/i, "") ?? "";
}

function referenceUrl(name: string) {
  return `https://baike.baidu.com/item/${encodeURIComponent(name)}`;
}

function makeSources(seed: CityGuideSeed, slug: string): GuideSource[] {
  return [
    ...seed.experiences.map((item, index) => ({
      id: `${slug}-experience-${index + 1}`,
      title: `${item.name}资料页`,
      siteName: "百度百科",
      url: referenceUrl(item.name),
      category: "景点与片区资料",
      official: false,
      checkedAt: CONTENT_CHECKED_AT,
    })),
    ...seed.restaurants.map((item, index) => ({
      id: `${slug}-restaurant-${index + 1}`,
      title: `${item.name}品牌资料页`,
      siteName: "百度百科",
      url: referenceUrl(item.name),
      category: "餐厅品牌与地方饮食",
      official: false,
      checkedAt: CONTENT_CHECKED_AT,
    })),
  ];
}

function asActivity(seed: CityGuideSeed, index: number, preference?: CityPreference): RouteActivity {
  if (preference === "博物馆") {
    const name = seed.museums[index % seed.museums.length];
    return {
      name,
      area: `${name}周边`,
      duration: "2—3小时",
      bestTime: "开馆后的首个预约时段",
      why: `${name}作为当天室内主体，先看常设展，再按体力补同馆临展。`,
      pitfall: "闭馆日、预约和入馆证件要求可能变化，出发前查看场馆具体公告。",
      alternative: seed.rainyPlans[index % seed.rainyPlans.length],
      kind: "博物馆",
    };
  }
  if (preference === "自然风景") {
    const name = seed.natureSpots[index % seed.natureSpots.length];
    return {
      name,
      area: `${name}景区`,
      duration: "建议预留半天",
      bestTime: "天气稳定的上午",
      why: `${name}承担当天主要户外体验，不再叠加另一个远距离自然景区。`,
      pitfall: "自然景区受天气、交通和季节影响明显，不在信息不足时承诺精确耗时。",
      alternative: seed.rainyPlans[index % seed.rainyPlans.length],
      kind: "自然",
    };
  }
  if (preference === "城市漫游" || preference === "松弛休息" || preference === "夜生活") {
    const neighborhood = seed.neighborhoods[index % seed.neighborhoods.length];
    return {
      name: neighborhood.name,
      area: neighborhood.name,
      duration: preference === "松弛休息" ? "1.5—2小时" : "2—3小时",
      bestTime: preference === "夜生活" ? "17:00以后" : "上午或傍晚",
      why: neighborhood.why,
      pitfall: "只走连续街巷，不为单个网红点跨区。",
      alternative: seed.experiences[(index + 4) % seed.experiences.length].alternative,
      kind: "街区",
    };
  }
  return { ...seed.experiences[index % seed.experiences.length], kind: "景点" };
}

function appointmentAdvice(activity: RouteActivity) {
  if (activity.kind === "博物馆" || /故宫|博物馆|纪念馆|石窟|遗址|基地|宫|寺/.test(activity.name)) {
    return "出发前核对预约、证件与开放安排";
  }
  return "通常可现场安排；节假日仍建议确认";
}

function transitBetween(fromArea: string, toArea: string) {
  if (fromArea === toArea || fromArea.includes(toArea) || toArea.includes(fromArea)) {
    return { mode: "步行", time: "步行可达，预留约10—20分钟" };
  }
  return { mode: "公共交通或短程打车", time: "建议预留约20—40分钟，并在出发前核对" };
}

function makeDay(
  seed: CityGuideSeed,
  routeDays: number,
  dayIndex: number,
  experienceIndexes: number[],
  preference?: CityPreference,
): EditorialDay {
  const first = asActivity(seed, experienceIndexes[0], preference);
  const second = experienceIndexes[1] === undefined ? undefined : asActivity(seed, experienceIndexes[1], preference);
  const restaurantOffset = preference === "地道美食" || preference === "标志性餐厅" ? 1 : 0;
  const restaurant = seed.restaurants[(dayIndex + restaurantOffset) % seed.restaurants.length];
  const dinner = seed.restaurants[(dayIndex + restaurantOffset + 1) % seed.restaurants.length];
  const foodDistrict = seed.foodDistricts[dayIndex % seed.foodDistricts.length];
  const neighborhood = seed.neighborhoods[dayIndex % seed.neighborhoods.length];
  const area = second && second.area !== first.area ? `${first.area}—${second.area}` : first.area;
  const afternoonTransit = transitBetween(first.area, second?.area ?? neighborhood.name);
  const startTime = preference === "少排队" || /清晨|开馆|上午/.test(first.bestTime) ? "08:30" : "09:30";
  const endTime = preference === "夜生活" ? "21:30" : dayIndex < seed.nightIdeas.length ? "20:30" : "19:30";
  const pace = preference === "松弛休息" ? "轻松" : routeDays === 2 ? "紧凑" : "正常";
  const nodes: EditorialDay["nodes"] = [
    {
      time: startTime,
      title: first.name,
      meta: `${first.duration} · ${first.bestTime}`,
      detail: `${first.why} 把它放在上午，是为了先完成当天最重要、也最受客流影响的一段。`,
      connection: `从住宿地直接进入${first.area}；到达后不再临时跨区。`,
      kind: first.kind,
      duration: first.duration,
      transportMode: "公共交通直达主片区",
      transportTime: "从住宿地出发的时间按实际位置核对",
      booking: appointmentAdvice(first),
      crowd: first.pitfall,
      imageSubject: first.name,
      pitfall: first.pitfall,
      alternative: first.alternative,
    },
    {
      time: "12:00",
      title: `${restaurant.name}午餐`,
      meta: `${restaurant.identity} · 当日午餐`,
      detail: `建议点${restaurant.dishes.join("、")}。${restaurant.why}`,
      connection: `优先选择${restaurant.area}内门店或同类餐馆，不为一顿饭横穿城市。`,
      kind: "午餐",
      duration: "约1—1.5小时",
      transportMode: transitBetween(first.area, restaurant.area).mode,
      transportTime: transitBetween(first.area, restaurant.area).time,
      booking: "用餐高峰前确认营业与排队方式",
      crowd: restaurant.queue,
      imageSubject: restaurant.name,
      pitfall: restaurant.queue,
      alternative: restaurant.alternative,
      sourceId: `${slugFromImage(CITY_PROFILES.find((item) => item.city === seed.city)!.image)}-restaurant-${dayIndex % seed.restaurants.length + 1}`,
      factLabel: "餐厅资料",
    },
    {
      time: "14:30",
      title: second?.name ?? neighborhood.name,
      meta: second ? `${second.duration} · ${second.area}` : `街区漫游 · ${neighborhood.name}`,
      detail: second ? second.why : neighborhood.why,
      connection: second
        ? `午餐后继续留在${area}，用公共交通或短程打车完成这一段。`
        : `午餐后只在${first.area}周边慢走，不增加新的主景点。`,
      pitfall: second?.pitfall,
      alternative: second?.alternative ?? foodDistrict.name,
      kind: second?.kind ?? "街区",
      duration: second?.duration ?? "1.5—2小时",
      transportMode: afternoonTransit.mode,
      transportTime: afternoonTransit.time,
      booking: second ? appointmentAdvice(second) : "通常无需预约",
      crowd: second?.pitfall ?? "午后客流增加时缩短主街停留",
      imageSubject: second?.name ?? neighborhood.name,
    },
    {
      time: "18:00",
      title: `${foodDistrict.name}晚餐`,
      meta: `地方饮食 · ${dinner.dishes.join(" / ")}`,
      detail: `${foodDistrict.advice} 如果想吃具体餐厅，可把${dinner.name}作为首选。`,
      connection: `晚餐仍在当天主片区解决，吃完即可结束主线。`,
      kind: "晚餐",
      duration: "约1—1.5小时",
      transportMode: "步行或短程公共交通",
      transportTime: "预留约15—30分钟",
      booking: "热门餐厅建议提前确认排队或预约规则",
      crowd: dinner.queue,
      imageSubject: dinner.name,
      pitfall: dinner.queue,
      alternative: dinner.alternative,
    },
  ];
  if (dayIndex < seed.nightIdeas.length) {
    nodes.push({
      time: "20:00",
      title: seed.nightIdeas[dayIndex],
      meta: "可选夜间体验",
      detail: "只在天气、体力和返程条件允许时加入，不为夜景再跨一个片区。",
      connection: "从晚餐区域步行或短程公共交通前往；太累就直接取消。",
      kind: "夜间",
      duration: "约45—90分钟",
      transportMode: "步行或短程公共交通",
      transportTime: "控制在约30分钟内；超过则取消",
      booking: "通常无需预约；演出类项目例外",
      crowd: "节假日晚间客流集中，优先保证返程便利",
      imageSubject: seed.nightIdeas[dayIndex],
    });
  }
  return {
    label: `DAY ${String(dayIndex + 1).padStart(2, "0")}`,
    title: `${area}，${routeDays === 2 ? "抓住最有辨识度的一天" : "一天只解决一个主要问题"}`,
    area,
    summary: `上午完成${first.name}，午后${second ? `转向${second.name}` : `留在${neighborhood.name}`}，两顿饭都在同一方向解决。`,
    reason: `${first.name}${second ? `与${second.name}` : `和${neighborhood.name}`}按片区组合；餐厅与夜间选择都服务于这条动线，而不是另起一条打卡清单。`,
    remove: second ? `先取消“${second.name}”，保留上午主景点和两顿正餐。` : `取消“${seed.nightIdeas[dayIndex % seed.nightIdeas.length]}”，下午提前休息。`,
    startTime,
    endTime,
    pace,
    transportSummary: `${afternoonTransit.mode}为主；跨片区时预留换乘缓冲，不使用实时路况数据。`,
    earlyStart: startTime === "08:30" ? `建议早到，优先完成${first.name}` : "不必特意早起，按首个节点开放时间到达",
    bookingItems: [first, second].filter((item): item is RouteActivity => Boolean(item)).filter((item) => appointmentAdvice(item).startsWith("出发前")).map((item) => item.name),
    queueAlternative: `${first.name}排队明显时改为${first.alternative}`,
    rainAlternative: seed.rainyPlans[dayIndex % seed.rainyPlans.length],
    lateStartAdjustment: `晚于10:30出发时，先删${second?.name ?? seed.nightIdeas[dayIndex % seed.nightIdeas.length]}，午餐顺延但不跨区。`,
    nodes,
  };
}

function makeRoutes(seed: CityGuideSeed): CityRouteEdition[] {
  return ([2, 3, 4] as const).map((days) => {
    const itinerary = routePatterns[days].map((indexes, dayIndex) => makeDay(seed, days, dayIndex, indexes));
    return {
      title: `${seed.city}${days}日${days === 2 ? "经典" : days === 3 ? "完整" : "深度"}路线`,
      days,
      label: `${days}日${days === 2 ? "周末版" : days === 3 ? "经典版" : "舒展版"}`,
      summary: itinerary.map((day, index) => `D${index + 1} ${day.nodes.map((node) => node.title).join(" → ")}`).join("；"),
      preferenceTags: ["第一次必去", "少折返"],
      pace: days === 2 ? "紧凑" : "正常",
      areas: itinerary.map((day) => day.area),
      startTime: itinerary[0]?.startTime ?? "09:00",
      endTime: itinerary[0]?.endTime ?? "20:30",
      transportSummary: `${seed.city}市内以${CITY_PROFILES.find((item) => item.city === seed.city)?.transit ?? "公共交通与步行"}为基础；每天只连接一个主片区和一个相邻片区。`,
      crowdAdvice: `${seed.experiences[0].name}等热门项目优先放在上午，节假日按替代项做减法。`,
      rainAlternative: seed.rainyPlans[0],
      removableStops: itinerary.map((day) => day.remove),
      itinerary,
    };
  });
}

const preferences: CityPreference[] = [
  "第一次必去", "地道美食", "标志性餐厅", "少排队", "少折返", "城市漫游",
  "建筑摄影", "博物馆", "自然风景", "夜生活", "松弛休息", "小众体验",
];

function makePreferenceContent(seed: CityGuideSeed, slug: string): PreferenceContentItem[] {
  const items: PreferenceContentItem[] = [];
  const add = (id: string, title: string, summary: string, kind: PreferenceContentItem["kind"], tags: CityPreference[]) => {
    items.push({ id: `${slug}-${id}`, title, summary, kind, tags });
  };
  seed.experiences.forEach((item, index) => add(
    `experience-${index + 1}`,
    item.name,
    `${item.why} ${item.pitfall}`,
    "景点",
    [
      ...(index < 3 ? ["第一次必去" as const] : ["小众体验" as const]),
      ...(index % 2 === 0 ? ["建筑摄影" as const] : ["少排队" as const]),
      "少折返",
    ],
  ));
  seed.restaurants.forEach((item, index) => add(`restaurant-${index + 1}`, item.name, `${item.why} 推荐${item.dishes.join("、")}。`, "餐厅", ["地道美食", "标志性餐厅", index > 1 ? "少排队" : "少折返"]));
  seed.neighborhoods.forEach((item, index) => add(`neighborhood-${index + 1}`, item.name, item.why, "街区", ["城市漫游", "建筑摄影", index > 0 ? "小众体验" : "松弛休息"]));
  seed.foodDistricts.forEach((item, index) => add(`food-${index + 1}`, item.name, item.advice, "美食", ["地道美食", "标志性餐厅", index === 0 ? "夜生活" : "城市漫游"]));
  seed.museums.forEach((name, index) => add(`museum-${index + 1}`, name, `作为${seed.city}的室内主项目，先核对预约和当日开放，再决定停留时长。`, "体验", ["博物馆", index === 2 ? "小众体验" : "少排队", "松弛休息"]));
  seed.natureSpots.forEach((name, index) => add(`nature-${index + 1}`, name, `用于补足${seed.city}的户外与季节体验，天气不合适时不强行前往。`, "体验", ["自然风景", index === 2 ? "小众体验" : "松弛休息", "少排队"]));
  seed.nightIdeas.forEach((name, index) => add(`night-${index + 1}`, name, "只在体力和返程条件允许时加入，结束后不再跨区。", "体验", ["夜生活", index === 1 ? "小众体验" : "城市漫游", "松弛休息"]));
  add("night-food", `${seed.foodDistricts[0].name}夜间觅食`, seed.foodDistricts[0].advice, "美食", ["夜生活", "地道美食", "少折返"]);
  seed.rainyPlans.forEach((text, index) => add(`rain-${index + 1}`, `雨天替代 ${index + 1}`, text, "路线", ["少排队", "博物馆", "松弛休息"]));
  seed.lowPriority.forEach((item, index) => add(`skip-${index + 1}`, `避开：${item.name}`, `${item.why} 可改为${item.alternative}`, "路线", ["少排队", "少折返", "小众体验"]));
  return items;
}

function makePreferenceRoutes(seed: CityGuideSeed): PreferenceRoute[] {
  const standardRoutes: PreferenceRoute[] = preferences.map((preference, preferenceIndex): PreferenceRoute => {
    const sequence = preferenceSequences[preference];
    const itinerary = Array.from({ length: 4 }, (_, dayIndex) => makeDay(
      seed,
      4,
      dayIndex,
      [sequence[dayIndex * 2], sequence[dayIndex * 2 + 1]],
      preference,
    ));
    const startTime = itinerary[0]?.startTime ?? "09:00";
    const endTime = itinerary[0]?.endTime ?? "20:30";
    return {
      preference,
      title: preference === "第一次必去"
        ? `适合第一次到${seed.city}的4日经典路线`
        : `${seed.city}${preference}4日路线`,
      summary: itinerary.map((day, index) => `D${index + 1} ${day.nodes.map((node) => node.title).join(" → ")}`).join("；"),
      days: 4,
      preferenceTags: [preference],
      pace: preference === "松弛休息" ? "轻松" : preference === "夜生活" ? "紧凑" : "正常",
      areas: itinerary.map((day) => day.area),
      startTime,
      endTime,
      transportSummary: preference === "少折返"
        ? "每天只进入一个主片区；同区步行，换区只用一次公共交通或短程打车。"
        : itinerary[0]?.transportSummary ?? "步行与公共交通组合",
      crowdAdvice: preference === "少排队"
        ? `先用${seed.experiences.slice(3).map((item) => item.name).join("、")}等替代热门主线，上午不追连续打卡。`
        : itinerary[0]?.queueAlternative ?? seed.experiences[0].pitfall,
      rainAlternative: seed.rainyPlans[preferenceIndex % seed.rainyPlans.length],
      removableStops: itinerary.map((day) => day.remove),
      itinerary,
    };
  });
  const rainItinerary = Array.from({ length: 4 }, (_, dayIndex) => {
    const day = makeDay(seed, 4, dayIndex, [dayIndex % seed.museums.length, (dayIndex + 1) % seed.museums.length], "博物馆");
    return {
      ...day,
      title: `雨天｜${day.area}室内线`,
      summary: `${seed.rainyPlans[dayIndex % seed.rainyPlans.length]} 午晚餐仍放在当天场馆周边。`,
      rainAlternative: seed.rainyPlans[dayIndex % seed.rainyPlans.length],
    };
  });
  const rainRoute: PreferenceRoute = {
    preference: "雨天替代",
    title: `${seed.city}雨天替代4日路线`,
    summary: rainItinerary.map((day, index) => `D${index + 1} ${day.nodes.map((node) => node.title).join(" → ")}`).join("；"),
    days: 4,
    preferenceTags: ["博物馆", "松弛休息"],
    pace: "轻松",
    areas: rainItinerary.map((day) => day.area),
    startTime: "09:30",
    endTime: "19:30",
    transportSummary: "室内场馆与同片区餐饮组合；减少露天步行，场馆之间使用公共交通或短程打车。",
    crowdAdvice: "雨天室内场馆客流可能集中；预约失败时直接使用当天第二个室内替代。",
    rainAlternative: seed.rainyPlans[0],
    removableStops: rainItinerary.map((day) => day.remove),
    itinerary: rainItinerary,
  };
  return [...standardRoutes, rainRoute];
}

export function createCompleteCityGuide(seed: CityGuideSeed): CompleteCityGuide {
  const profile = CITY_PROFILES.find((item) => item.city === seed.city);
  if (!profile) throw new Error(`城市基础库中不存在：${seed.city}`);
  const knowledge = getCityKnowledge(profile);
  const slug = slugFromImage(profile.image);
  const sources = makeSources(seed, slug);
  const routes = makeRoutes(seed);
  const preferenceContent = makePreferenceContent(seed, slug);
  const preferenceRoutes = makePreferenceRoutes(seed);
  const defaultDays = seed.defaultDays ?? (profile.idealDays.startsWith("2") ? 3 : 4);
  const defaultRoute = routes.find((item) => item.days === defaultDays) ?? routes[1];
  const foods = [
    ...profile.foods.map((name, index) => ({
      name,
      when: index === 0 ? "早餐或午餐" : index === 1 ? "午餐" : "晚餐或加餐",
      order: `先点一份${name}建立味觉印象，再按人数补一道清淡菜或主食。`,
      note: `把它安排在${seed.foodDistricts[index % 2].name}附近，不为单一店铺跨区。`,
    })),
    ...seed.extraFoods.map((name, index) => ({
      name,
      when: index === 0 ? "早餐" : index === 1 ? "午后加餐" : "晚餐共享",
      order: `第一次尝试先点小份${name}，保留胃口给同一天的另一项地方味道。`,
      note: `更适合在${seed.foodDistricts[(index + 1) % 2].name}顺路解决。`,
    })),
  ];
  const guide: EditorialCityGuide = {
    slug,
    city: profile.city,
    province: profile.province,
    image: profile.image,
    imageAlt: `${profile.city}${profile.sights[0]}及城市代表景观`,
    eyebrow: `${profile.region.toUpperCase()} · ${profile.tags.slice(0, 2).join(" / ")}`,
    title: `${profile.city}，${profile.hook}`,
    intro: seed.intro,
    fit: seed.fit,
    stayAdvice: seed.stayAdvice,
    defaultDays,
    routeOptions: routes.map((item) => ({ days: item.days, label: item.label, summary: item.summary, dayIndexes: [] })),
    guideTypes: [...EDITORIAL_GUIDE_TYPES],
    guideTypeNotes: typeNotes,
    themes: [
      { title: `第一次去${profile.city}，${defaultDays}天怎么安排`, audience: "第一次到访、想少做无效功课", duration: `${defaultDays}天`, advice: `先完成${seed.experiences[0].area}与${seed.experiences[2].area}两条主线，再决定是否加入${seed.experiences[4].area}。`, pitfall: seed.firstTimerMistakes[0], alternative: `时间不足时保留${seed.experiences[0].name}，删除${seed.lowPriority[0].name}。`, conclusion: "编辑整理" },
      { title: `${seed.experiences[0].name}到底值不值得留半天`, audience: `对${profile.tags[0]}感兴趣的人`, duration: seed.experiences[0].duration, advice: seed.experiences[0].why, pitfall: seed.experiences[0].pitfall, alternative: seed.experiences[0].alternative, conclusion: "多来源共同建议" },
      { title: `${profile.city}吃什么，才不会每顿都像游客餐`, audience: "把地方饮食放进路线的人", duration: "分散到三至四餐", advice: `把${profile.foods.join("、")}分别放进${seed.foodDistricts.map((item) => item.name).join("和")}，不要一天连吃同一种重口味。`, pitfall: seed.firstTimerMistakes[1], alternative: `具体店排队时保留菜名，换${seed.foodDistricts[0].name}内长期经营的同类餐馆。`, conclusion: "编辑整理" },
    ],
    days: defaultRoute.itinerary,
    restaurants: seed.restaurants.map((item, index) => ({
      name: item.name,
      identity: item.identity,
      why: item.why,
      order: item.dishes,
      avoid: "不要为了凑招牌菜点满一桌；两人优先两道主菜加一份蔬菜或主食。",
      plannedFor: item.meal,
      area: item.area,
      queue: item.queue,
      alternative: item.alternative,
      checkedAt: CONTENT_CHECKED_AT,
      sourceId: `${slug}-restaurant-${index + 1}`,
    })),
    foods,
    decisions: [
      ...seed.experiences.slice(0, 3).map((item) => ({ name: item.name, verdict: "值得去" as const, why: item.why, alternative: item.alternative })),
      ...seed.lowPriority.map((item) => ({ name: item.name, verdict: "可以放弃" as const, why: item.why, alternative: item.alternative })),
    ],
    situations: [
      ...seed.rainyPlans.map((advice, index) => ({ title: `雨天方案 ${index + 1}`, advice })),
      ...seed.nightIdeas.map((advice, index) => ({ title: `夜间选择 ${index + 1}`, advice })),
    ],
    checklist: [
      `核对${seed.experiences[0].name}与计划内场馆的预约和开放安排`,
      `出发前一天查看${profile.city}天气，把三个雨天备选保存在手机里`,
      "节假日提前购买往返车票，铁路行程以铁路12306为准",
      `为${seed.restaurants[0].name}等正餐准备同片区替代，不把排队当成必做项目`,
      seed.arrivalTips[0],
    ],
    sources,
    editedAt: CONTENT_CHECKED_AT,
  };
  return {
    ...guide,
    region: profile.region,
    aliases: profile.aliases ?? [],
    recommendedSeasons: knowledge.recommendedSeasons,
    idealDays: profile.idealDays,
    dailyBudget: profile.dailyBudget,
    transit: profile.transit,
    travelTags: profile.tags,
    cardImage: profile.image,
    cardImageAlt: `${profile.city}${profile.sights[0]}首页城市卡片图`,
    images: [
      { src: profile.image, alt: `${profile.city}${profile.sights[0]}代表景观`, role: "cover", creditId: `${slug}-cover` },
      { src: `/cities/${slug}-detail-1.jpg`, alt: `${profile.city}${seed.experiences[1].name}地域景观`, role: "landmark", creditId: `${slug}-detail-1` },
      { src: `/cities/${slug}-detail-2.jpg`, alt: `${profile.city}${seed.neighborhoods[0].name}街区风貌`, role: "neighborhood", creditId: `${slug}-detail-2` },
    ],
    experiences: seed.experiences,
    foodDistricts: seed.foodDistricts,
    neighborhoods: seed.neighborhoods,
    rainyPlans: seed.rainyPlans,
    nightIdeas: seed.nightIdeas,
    arrivalTips: seed.arrivalTips,
    firstTimerMistakes: seed.firstTimerMistakes,
    routes,
    preferenceContent,
    preferenceRoutes,
    sources,
  };
}
