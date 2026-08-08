import {
  DeepSeekError,
  generateTravelPlan,
  isDeepSeekConfigured,
  type TravelPlan,
  type TravelRequest,
} from "@/lib/deepseek";
import { createCityDemoPlan, findCityProfile } from "@/lib/cities";
import { canShowTicketPrice, visibleBudgetItems } from "@/lib/public-trip";
import { collectTravelEvidence, type TravelEvidence, type TravelSource } from "@/lib/travel-data";
import { guardJsonRequest } from "@/lib/request-guard";

const allowedPaces = new Set(["松弛", "舒展", "充实"]);
const allowedBudgets = new Set(["经济", "适中", "舒适"]);
const allowedTransport = new Set(["公共交通优先", "打车节省时间", "自驾周边"]);
const UNRELIABLE_DYNAMIC_VALUE = /待配置|待搜索|待核验|未知|暂无|不确定|AI预算估算|AI估算/i;

function usableDynamicValue(value?: string) {
  return Boolean(value?.trim()) && !UNRELIABLE_DYNAMIC_VALUE.test(value ?? "");
}

function sourceMatches(source: TravelSource, placeName: string) {
  const normalize = (value: string) => value.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  const needle = normalize(placeName);
  const haystack = normalize(`${source.title}${source.snippet}`);
  return needle.length >= 2 && haystack.includes(needle);
}

function matchingSource(evidence: TravelEvidence, placeName: string, categories: TravelSource["category"][]) {
  return evidence.sources.find((source) => categories.includes(source.category) && sourceMatches(source, placeName));
}

function attachReliableDynamicFacts(plan: TravelPlan, evidence: TravelEvidence, days: number): TravelPlan {
  const highlights = plan.highlights.map((item) => {
    const knowledgePoi = evidence.cityKnowledge?.pois.find((poi) => poi.name === item.name);
    const ticketSource = matchingSource(evidence, item.name, ["门票与开放"]);
    const bookingSource = matchingSource(evidence, item.name, ["预约与通知"])
      ?? (ticketSource && /预约/.test(ticketSource.snippet) ? ticketSource : undefined);
    const enriched: TravelPlan["highlights"][number] = {
      name: item.name,
      type: item.type,
      why: item.why,
      duration: item.duration,
      area: item.area || knowledgePoi?.area,
    };

    if (ticketSource && usableDynamicValue(item.ticketReference)
      && (ticketSource.priceType === "官方公开价" || ticketSource.priceType === "联网搜索参考价")) {
      enriched.ticketReference = item.ticketReference;
      enriched.ticketSource = ticketSource;
      enriched.ticketCheckedAt = ticketSource.queriedAt;
      enriched.priceType = ticketSource.priceType;
    }
    if (ticketSource && usableDynamicValue(item.openingHours)) {
      enriched.openingHours = item.openingHours;
      enriched.openingSource = ticketSource;
      enriched.openingCheckedAt = ticketSource.queriedAt;
    }
    if (bookingSource && usableDynamicValue(item.bookingNote)) {
      enriched.bookingNote = item.bookingNote;
      enriched.bookingSource = bookingSource;
      enriched.bookingCheckedAt = bookingSource.queriedAt;
    }
    return enriched;
  });
  const hasReliableTicketData = highlights.some(canShowTicketPrice);

  return {
    ...plan,
    highlights,
    estimatedTotalBudget: hasReliableTicketData
      ? plan.estimatedTotalBudget
      : `${plan.estimatedDailyBudget} × ${days} 天（不含动态门票及往返大交通）`,
    budgetBreakdown: visibleBudgetItems(plan.budgetBreakdown, hasReliableTicketData),
  };
}

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
        message: "已使用城市基础资料生成攻略，营业与收费信息请在出发前确认。",
        dataProviders: { search: "demo" },
      });
    }

    const evidence = await collectTravelEvidence(input, profile);
    const generatedPlan = attachReliableDynamicFacts(await generateTravelPlan(input, evidence), evidence, input.days);
    const warnings = [...evidence.warnings];
    const searchStatus = !evidence.searchConfigured ? "off" : evidence.sources.length ? "live" : "partial";
    const baselineSources = evidence.cityKnowledge?.sources.map((source) => ({
      title: `${profile.city}城市概况与文旅资源`, url: source.url, siteName: source.name,
      snippet: `城市资料整理于 ${evidence.cityKnowledge?.queriedAt}；营业、收费与预约信息请在出发前通过官方渠道确认。`,
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
