import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const socialImage = `${baseUrl}/og-v2.png`;

  return {
    title: "旅策｜中国城市美食、景点、交通与预算一体规划",
    description: "根据旅行偏好、预算和节奏，为中国城市生成有取舍、少折返、真正走得通的最佳旅行方案。",
    openGraph: {
      title: "旅策｜选出最适合你的城市走法",
      description: "中国城市旅行攻略：特色美食、代表景点、城市交通和预算拆分，一次规划清楚。",
      images: [{ url: socialImage, width: 1747, height: 917, alt: "旅策中国城市旅行规划平台" }],
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "旅策｜选出最适合你的城市走法",
      description: "美食、景点、交通和预算，一次规划清楚。",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
