import { findCityProfile } from "@/lib/cities";
import { guardJsonRequest } from "@/lib/request-guard";
import { estimateTickets } from "@/lib/travel-data";

export async function POST(request: Request) {
  const denied = guardJsonRequest(request, "ticket-estimate");
  if (denied) return denied;
  try {
    const body = await request.json() as { destination?: unknown; poiNames?: unknown };
    const profile = findCityProfile(typeof body.destination === "string" ? body.destination : "");
    const poiNames = Array.isArray(body.poiNames) ? body.poiNames.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 80)).filter(Boolean).slice(0, 5) : [];
    if (!profile || !poiNames.length) return Response.json({ error: "INVALID_REQUEST", message: "请提供已支持的中国城市和景点名称" }, { status: 400 });
    return Response.json(await estimateTickets(profile.city, poiNames));
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "INVALID_JSON", message: "请求内容不是合法 JSON" }, { status: 400 });
    return Response.json({ error: "TICKET_SEARCH_FAILED", message: "票价检索暂不可用，请以官方渠道为准" }, { status: 503 });
  }
}
