import { guardJsonRequest } from "@/lib/request-guard";
import { calculateRoute, type RouteRequest } from "@/lib/travel-data";

const modes = new Set(["公交", "驾车", "步行"]);

export async function POST(request: Request) {
  const denied = guardJsonRequest(request, "map-route");
  if (denied) return denied;
  try {
    const body = await request.json() as Record<string, unknown>;
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 40) : "";
    const mode = typeof body.mode === "string" ? body.mode : "";
    const originName = typeof body.originName === "string" ? body.originName.trim().slice(0, 80) : undefined;
    const destinationName = typeof body.destinationName === "string" ? body.destinationName.trim().slice(0, 80) : undefined;
    const coordinate = (value: unknown) => typeof value === "string" && /^\d{1,3}(?:\.\d+)?,\d{1,2}(?:\.\d+)?$/.test(value) ? value : undefined;
    const origin = coordinate(body.origin);
    const destination = coordinate(body.destination);
    if (!city || !modes.has(mode) || !(origin || originName) || !(destination || destinationName)) {
      return Response.json({ error: "INVALID_REQUEST", message: "请提供城市、起终点和交通方式" }, { status: 400 });
    }
    return Response.json(await calculateRoute({ city, mode: mode as RouteRequest["mode"], origin, destination, originName, destinationName }));
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "INVALID_JSON", message: "请求内容不是合法 JSON" }, { status: 400 });
    return Response.json({ error: "ROUTE_FAILED", message: "路线服务暂不可用" }, { status: 503 });
  }
}
