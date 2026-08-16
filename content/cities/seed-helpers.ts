import type { CityExperience, SeedRestaurant } from "./types";

export function experience(
  name: string,
  area: string,
  why: string,
  pitfall: string,
  alternative: string,
  duration = "2—3小时",
  bestTime = "工作日上午",
): CityExperience {
  return { name, area, why, pitfall, alternative, duration, bestTime };
}
export function restaurant(
  name: string,
  identity: string,
  dishes: [string, string],
  area: string,
  meal: string,
  why: string,
  queue: string,
  alternative: string,
): SeedRestaurant {
  return { name, identity, dishes, area, meal, why, queue, alternative };
}
