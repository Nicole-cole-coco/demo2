import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const socialImage = `${baseUrl}/og.png`;

  return {
    title: "旅策｜把灵感排成真正走得通的旅行",
    description: "基于真实信息与个人偏好，生成顺路、可改、可追溯的旅行攻略。",
    openGraph: {
      title: "旅策｜让每一次出发，都有从容的余地",
      description: "AI 旅行攻略生成平台：真实信息优先，路线合理，随时局部调整。",
      images: [{ url: socialImage, width: 1672, height: 941, alt: "旅策旅行规划平台" }],
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "旅策｜让每一次出发，都有从容的余地",
      description: "把散落的灵感，排成一份真正走得通的攻略。",
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
