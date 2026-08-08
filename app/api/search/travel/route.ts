import { findCityProfile } from "@/lib/cities";
import type { TravelRequest } from "@/lib/deepseek";
import { guardJsonRequest } from "@/lib/request-guard";
import { collectTravelEvidence } from "@/lib/travel-data";

export async function POST(request: Request) {
  const denied = guardJsonRequest(request, "travel-search");
  if (denied) return denied;
  try {
    const body = await request.json() as { destination?: unknown; originCity?: unknown };
    const destination = typeof body.destination === "string" ? body.destination.trim() : "";
    const profile = findCityProfile(destination);
    if (!profile) return Response.json({ error: "UNSUPPORTED_DESTINATION", message: "该目的地不在已核验的中国城市库中" }, { status: 422 });
    const input: TravelRequest = {
      destination: profile.city,
      originCity: typeof body.originCity === "string" ? body.originCity.trim().slice(0, 40) || undefined : undefined,
      startDate: new Date().toISOString().slice(0, 10), days: 3, pace: "舒展", budget: "适中",
      interests: [], transport: "公共交通优先",
    };
    const evidence = await collectTravelEvidence(input, profile);
    return Response.json({
      status: !evidence.searchConfigured ? "unavailable" : evidence.sources.length ? evidence.cacheStatus : "partial",
      provider: evidence.searchProvider,
      searchedAt: evidence.searchedAt,
      queryCount: evidence.queryCount,
      sources: evidence.sources,
      warnings: evidence.warnings,
    });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "INVALID_JSON", message: "请求内容不是合法 JSON" }, { status: 400 });
    return Response.json({ error: "SEARCH_FAILED", message: "联网资料暂不可用，动态信息将标记待核验" }, { status: 503 });
  }
}
