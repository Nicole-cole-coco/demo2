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
    title: "旅策｜把零散经验整理成可直接执行的城市攻略",
    description: "中国城市实用旅行攻略：每天怎么走、吃什么、删什么，以及排队、预约、雨天和替代方案。",
    openGraph: {
      title: "旅策｜可以直接照着走的中国城市攻略",
      description: "把路线、餐厅、取舍、排队与替代方案整理成一份城市专刊。",
      images: [{ url: socialImage, width: 1747, height: 917, alt: "旅策中国城市旅行规划平台" }],
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "旅策｜可以直接照着走的中国城市攻略",
      description: "路线、餐厅、取舍与替代方案，一次整理清楚。",
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
