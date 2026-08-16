import type { CityGuideSeed } from "./types";
import { experience as e, restaurant as r } from "./seed-helpers";

type CompactInput = {
  city: string;
  intro: string;
  fit: string;
  stay: string;
  days?: 2 | 3 | 4;
  experiences: [string, string, string, string][];
  foods: [string, string, string, string, string];
  museums: [string, string, string];
  nature: [string, string, string];
  restaurants: [string, string, string, string, string][];
  districts: [string, string];
  neighborhoods: [string, string, string];
  rain: [string, string, string];
  night: [string, string];
  arrival: [string, string];
  mistakes: [string, string];
  skips: [string, string, string][];
};

export function compactSeed(input: CompactInput): CityGuideSeed {
  if (input.experiences.length !== 6 || input.restaurants.length !== 4 || input.skips.length !== 2) {
    throw new Error(`${input.city} 的精简内容数量不完整`);
  }
  return {
    city: input.city,
    intro: input.intro,
    fit: input.fit,
    stayAdvice: input.stay,
    defaultDays: input.days ?? 3,
    experiences: input.experiences.map(([name, area, why, alternative], index) => e(
      name,
      area,
      why,
      `把${name}放在${index < 2 ? "上午客流较低时" : "当天同片区"}；高峰或天气不合适时不要硬等。`,
      alternative,
      index === 5 ? "半天" : "2—3小时",
      index % 2 === 0 ? "上午" : "下午或傍晚",
    )) as CityGuideSeed["experiences"],
    extraFoods: input.foods,
    museums: input.museums,
    natureSpots: input.nature,
    restaurants: input.restaurants.map(([name, identity, firstDish, secondDish, area], index) => r(
      name,
      identity,
      [firstDish, secondDish],
      area,
      `DAY ${index + 1} ${index % 2 === 0 ? "午餐" : "晚餐"}`,
      `${name}能在${area}顺路完成一顿有${input.city}辨识度的正餐，不需要为店名跨区。`,
      "午晚餐高峰可能候位；超过可接受时间就使用同片区替代。",
      `保留${firstDish}这道代表味道，换${area}内长期经营的同类餐馆。`,
    )) as CityGuideSeed["restaurants"],
    foodDistricts: [
      { name: input.districts[0], advice: `适合把${input.foods.slice(0, 3).join("、")}分散到正餐和加餐，不为单店折返。` },
      { name: input.districts[1], advice: `优先长期经营的地方餐馆；价格、营业与排队以到店前公开信息为准。` },
    ],
    neighborhoods: input.neighborhoods.map((name, index) => ({ name, why: `${name}适合用${index === 0 ? "连续步行" : "一至两小时慢走"}理解${input.city}的街区尺度与在地生活。` })) as CityGuideSeed["neighborhoods"],
    rainyPlans: input.rain,
    nightIdeas: input.night,
    arrivalTips: input.arrival,
    firstTimerMistakes: input.mistakes,
    lowPriority: input.skips.map(([name, why, alternative]) => ({ name, why, alternative })) as CityGuideSeed["lowPriority"],
  };
}
