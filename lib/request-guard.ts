type Bucket = { resetAt: number; count: number };

const buckets = new Map<string, Bucket>();

function boundedInteger(raw: string | undefined, fallback: number, maximum: number) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? Math.min(value, maximum) : fallback;
}

function clientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "anonymous";
}

/** Public anonymous access guard: same-origin checks, JSON size checks and process-local throttling. */
export function guardJsonRequest(request: Request, scope: string) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return Response.json({ error: "ORIGIN_NOT_ALLOWED", message: "仅接受同源网站请求" }, { status: 403 });
  }
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json({ error: "JSON_REQUIRED", message: "请求必须使用 JSON 格式" }, { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 24_000) {
    return Response.json({ error: "REQUEST_TOO_LARGE", message: "请求内容过大" }, { status: 413 });
  }

  const windowMs = boundedInteger(process.env.REQUEST_LIMIT_WINDOW_MS, 15 * 60 * 1000, 60 * 60 * 1000);
  const maximum = boundedInteger(process.env.REQUEST_LIMIT_MAX, 10, 100);
  const key = `${scope}:${clientAddress(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { resetAt: now + windowMs, count: 1 });
    return null;
  }
  if (bucket.count >= maximum) {
    return Response.json(
      { error: "RATE_LIMITED", message: "匿名生成请求过于频繁，请稍后再试", retryAfter: Math.ceil((bucket.resetAt - now) / 1000) },
      { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) } },
    );
  }
  bucket.count += 1;
  return null;
}
