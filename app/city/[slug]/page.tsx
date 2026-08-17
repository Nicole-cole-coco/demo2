import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PUBLISHED_CITY_GUIDES, getCompleteCityGuide } from "@/content/cities";
import CityGuideView from "./CityGuideView";

type CityPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLISHED_CITY_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getCompleteCityGuide(slug);
  if (!guide) return { title: "城市攻略暂未开放｜旅策" };
  return {
    title: `${guide.city}实用旅行攻略｜旅策`,
    description: `${guide.city}${guide.defaultDays}日可执行路线：每天怎么走、吃什么、删什么，以及排队、雨天和替代方案。`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const guide = getCompleteCityGuide(slug);
  if (!guide) notFound();

  return <CityGuideView guide={guide} />;
}
