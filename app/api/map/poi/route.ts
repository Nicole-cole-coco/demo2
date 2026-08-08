import { guardJsonRequest } from "@/lib/request-guard";
import { searchMapPois } from "@/lib/travel-data";

export async function POST(request: Request) {
  const denied = guardJsonRequest(request, "map-poi");
  if (denied) return denied;
  try {
    const body = await request.json() as { city?: unknown; keywords?: unknown };
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 40) : "";
    const keywords = Array.isArray(body.keywords) ? body.keywords.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 80)).filter(Boolean).slice(0, 10) : [];
    if (!city || !keywords.length) return Response.json({ error: "INVALID_REQUEST", message: "请提供城市和地点名称" }, { status: 400 });
    return Response.json(await searchMapPois(city, keywords));
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "INVALID_JSON", message: "请求内容不是合法 JSON" }, { status: 400 });
    return Response.json({ error: "MAP_FAILED", message: "地图 POI 服务暂不可用" }, { status: 503 });
  }
}
