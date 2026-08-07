import {
  DeepSeekError,
  generateTravelPlan,
  type TravelRequest,
} from "@/lib/deepseek";

const allowedPaces = new Set(["松弛", "舒展", "充实"]);
const allowedBudgets = new Set(["经济", "适中", "舒适"]);
const allowedTransport = new Set(["公共交通优先", "打车节省时间", "自驾周边"]);

function parseRequest(value: unknown): TravelRequest | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const destination = typeof body.destination === "string" ? body.destination.trim() : "";
  const originCity = typeof body.originCity === "string" ? body.originCity.trim() : "";
  const startDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
  const days = Number(body.days);
  const pace = body.pace;
  const budget = body.budget;
  const transport = body.transport;
  const constraints = typeof body.constraints === "string" ? body.constraints.trim() : "";
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  if (
    destination.length < 2 ||
    destination.length > 40 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 10 ||
    typeof pace !== "string" ||
    !allowedPaces.has(pace) ||
    typeof budget !== "string" ||
    !allowedBudgets.has(budget) ||
    typeof transport !== "string" ||
    !allowedTransport.has(transport) ||
    originCity.length > 40 ||
    constraints.length > 300 ||
    interests.length > 5 ||
    interests.some((item) => item.length > 20)
  ) return null;

  return {
    destination,
    originCity: originCity || undefined,
    startDate,
    days,
    pace: pace as TravelRequest["pace"],
    budget: budget as TravelRequest["budget"],
    interests,
    transport: transport as TravelRequest["transport"],
    constraints: constraints || undefined,
  };
}

export async function POST(request: Request) {
  try {
    const input = parseRequest(await request.json());
    if (!input) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "请检查城市、日期、天数与旅行偏好" },
        { status: 400 },
      );
    }

    const plan = await generateTravelPlan(input);
    return Response.json({ plan, provider: "deepseek" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "INVALID_JSON", message: "请求内容不是合法 JSON" },
        { status: 400 },
      );
    }
    if (error instanceof DeepSeekError) {
      return Response.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    return Response.json(
      { error: "INTERNAL_ERROR", message: "服务暂时不可用，请稍后重试" },
      { status: 500 },
    );
  }
}
