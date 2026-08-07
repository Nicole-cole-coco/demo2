export type TravelRequest = {
  destination: string;
  startDate: string;
  days: number;
  party: "solo" | "couple" | "friends" | "family";
  pace: "松弛" | "舒展" | "充实";
  budget: "经济" | "适中" | "舒适";
  interests: string[];
};

export type TravelStop = {
  time: string;
  title: string;
  meta: string;
  detail: string;
  tone: "sage" | "clay" | "lavender" | "blue";
  source?: string;
};

export type TravelDay = {
  label: string;
  date: string;
  theme: string;
  note: string;
  stops: TravelStop[];
};

export type TravelPlan = {
  title: string;
  subtitle: string;
  destination: string;
  days: TravelDay[];
  verificationNote: string;
};

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class DeepSeekError extends Error {
  constructor(
    message: string,
    readonly status = 502,
    readonly code = "DEEPSEEK_ERROR",
  ) {
    super(message);
    this.name = "DeepSeekError";
  }
}

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_TIMEOUT_MS = 45_000;

export function getDeepSeekConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const baseUrl = (process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL;
  const configuredTimeout = Number(process.env.DEEPSEEK_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? Math.min(configuredTimeout, 90_000)
    : DEFAULT_TIMEOUT_MS;

  return { apiKey, baseUrl, model, timeoutMs };
}

export function isDeepSeekConfigured() {
  return Boolean(getDeepSeekConfig().apiKey);
}

function systemPrompt() {
  return `你是“旅策”的中国城市旅行规划引擎。你只能规划中国境内（含港澳台）的城市旅行。

输出必须是一个合法 JSON 对象，不要使用 Markdown，不要添加 JSON 之外的文字。

如果目的地不属于中国，输出：
{"error":"UNSUPPORTED_DESTINATION","message":"目前仅支持中国境内城市"}

正常输出严格遵守以下 JSON 结构：
{
  "title": "有编辑感的行程标题",
  "subtitle": "日期、同行人与节奏的简短摘要",
  "destination": "规范城市名",
  "verificationNote": "说明哪些时效信息需出发前复核",
  "days": [
    {
      "label": "DAY 01",
      "date": "10月23日 · 周五",
      "theme": "当日主题 · 动线摘要",
      "note": "当天安排原则和留白说明",
      "stops": [
        {
          "time": "09:00",
          "title": "地点或活动",
          "meta": "类型 · 建议停留 1小时",
          "detail": "具体、克制、可执行的建议",
          "tone": "sage",
          "source": "出发前核验"
        }
      ]
    }
  ]
}

要求：
1. days 数量必须与用户要求一致，每天 3 至 5 个顺路站点，并保留合理用餐、交通与休息时间。
2. tone 只能是 sage、clay、lavender、blue 之一。
3. 不虚构实时天气、票价、营业时间、拥堵或“已核验”结论；会变化的信息写“出发前核验”。
4. 不提供没有依据的精确价格，用预算级别给出克制建议。
5. 使用简体中文，优先呈现当地代表性、地域辨识度高的体验，避免同质化网红清单。`;
}

function userPrompt(input: TravelRequest) {
  const partyLabels: Record<TravelRequest["party"], string> = {
    solo: "一人出行",
    couple: "两人同行",
    friends: "朋友出行",
    family: "亲子家庭",
  };

  return `请生成 JSON 旅行攻略：
- 目的地：${input.destination}
- 出发日期：${input.startDate}
- 天数：${input.days} 天
- 同行：${partyLabels[input.party]}
- 节奏：${input.pace}
- 预算：${input.budget}
- 兴趣：${input.interests.join("、") || "城市代表性体验"}`;
}

function isTravelPlan(value: unknown): value is TravelPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<TravelPlan>;
  if (
    typeof plan.title !== "string" ||
    typeof plan.subtitle !== "string" ||
    typeof plan.destination !== "string" ||
    typeof plan.verificationNote !== "string" ||
    !Array.isArray(plan.days)
  ) return false;

  return plan.days.every((day) => {
    if (!day || typeof day !== "object") return false;
    const candidate = day as Partial<TravelDay>;
    return (
      typeof candidate.label === "string" &&
      typeof candidate.date === "string" &&
      typeof candidate.theme === "string" &&
      typeof candidate.note === "string" &&
      Array.isArray(candidate.stops) &&
      candidate.stops.length >= 1 &&
      candidate.stops.every((stop) => {
        if (!stop || typeof stop !== "object") return false;
        const item = stop as Partial<TravelStop>;
        return (
          typeof item.time === "string" &&
          typeof item.title === "string" &&
          typeof item.meta === "string" &&
          typeof item.detail === "string" &&
          ["sage", "clay", "lavender", "blue"].includes(item.tone ?? "")
        );
      })
    );
  });
}

export async function generateTravelPlan(input: TravelRequest): Promise<TravelPlan> {
  const { apiKey, baseUrl, model, timeoutMs } = getDeepSeekConfig();
  if (!apiKey) {
    throw new DeepSeekError("DeepSeek API 尚未配置", 503, "DEEPSEEK_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: userPrompt(input) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.45,
        max_tokens: 6000,
        stream: false,
      }),
      signal: controller.signal,
    });

    const payload = await response.json() as DeepSeekChatResponse;
    if (!response.ok) {
      throw new DeepSeekError(
        payload.error?.message || `DeepSeek 请求失败（${response.status}）`,
        response.status >= 400 && response.status < 500 ? 502 : response.status,
        "DEEPSEEK_UPSTREAM_ERROR",
      );
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new DeepSeekError("DeepSeek 返回了空内容，请重试", 502, "DEEPSEEK_EMPTY_RESPONSE");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new DeepSeekError("DeepSeek 返回内容不是合法 JSON，请重试", 502, "DEEPSEEK_INVALID_JSON");
    }

    if (parsed && typeof parsed === "object" && "error" in parsed) {
      const rejection = parsed as { error?: string; message?: string };
      throw new DeepSeekError(
        rejection.message || "目前仅支持中国境内城市",
        422,
        rejection.error || "UNSUPPORTED_DESTINATION",
      );
    }

    if (!isTravelPlan(parsed) || parsed.days.length !== input.days) {
      throw new DeepSeekError("DeepSeek 返回的攻略结构不完整，请重试", 502, "DEEPSEEK_INVALID_SCHEMA");
    }

    return parsed;
  } catch (error) {
    if (error instanceof DeepSeekError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new DeepSeekError("DeepSeek 响应超时，请稍后重试", 504, "DEEPSEEK_TIMEOUT");
    }
    throw new DeepSeekError("暂时无法连接 DeepSeek，请稍后重试", 502, "DEEPSEEK_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}
