import { getDeepSeekConfig, isDeepSeekConfigured } from "@/lib/deepseek";

export async function GET() {
  const { model } = getDeepSeekConfig();
  return Response.json({
    configured: isDeepSeekConfigured(),
    provider: "deepseek",
    model,
  });
}
