import {
  DeepSeekError,
  generateTravelPlan,
  isDeepSeekConfigured,
  type TravelRequest,
} from "@/lib/deepseek";
import { createCityDemoPlan, findCityProfile } from "@/lib/cities";
import { collectTravelEvidence } from "@/lib/travel-data";
import { guardJsonRequest } from "@/lib/request-guard";

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
    const denied = guardJsonRequest(request, "ai-generate");
    if (denied) return denied;
    const input = parseRequest(await request.json());
    if (!input) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "请检查城市、日期、天数与旅行偏好" },
        { status: 400 },
      );
    }

    const profile = findCityProfile(input.destination);
    if (!profile) {
      return Response.json(
        { error: "UNSUPPORTED_DESTINATION", message: "旅策目前只服务中国境内城市；该目的地不在已核验城市库中，暂不生成攻略。" },
        { status: 422 },
      );
    }
    input.destination = profile.city;

    if (!isDeepSeekConfigured()) {
      const plan = createCityDemoPlan(input);
      return Response.json({
        plan,
        provider: "demo",
        mode: "demo",
        message: "DeepSeek 或联网搜索尚未配置，已使用 Codex 预置城市资料生成待核验版本。",
        dataProviders: { search: "demo" },
      });
    }

    const evidence = await collectTravelEvidence(input, profile);
    const generatedPlan = await generateTravelPlan(input, evidence);
    const warnings = [...evidence.warnings];
    const searchStatus = !evidence.searchConfigured ? "off" : evidence.sources.length ? "live" : "partial";
    const baselineSources = evidence.cityKnowledge?.sources.map((source) => ({
      title: `${profile.city}城市概况与文旅资源`, url: source.url, siteName: source.name,
      snippet: `Codex 预置城市资料查询于 ${evidence.cityKnowledge?.queriedAt}；动态字段仍以本次搜索或出发前核验为准。`,
      category: "城市基础资料" as const, queriedAt: source.queriedAt, official: source.official,
      confidence: source.confidence, priceType: "非价格信息" as const,
    })) ?? [];
    const plan = {
      ...generatedPlan,
      liveData: {
        searchedAt: evidence.searchedAt,
        searchStatus,
        searchProvider: evidence.searchProvider,
        cacheStatus: evidence.cacheStatus,
        queryCount: evidence.queryCount,
        sources: [...baselineSources, ...evidence.sources],
        warnings,
      },
    };
    return Response.json({ plan, provider: "deepseek", mode: "live", dataProviders: { search: evidence.searchProvider } });
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
