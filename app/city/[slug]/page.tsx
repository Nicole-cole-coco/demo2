import type { Metadata } from "next";
import Link from "next/link";
import { EDITORIAL_CITY_GUIDES, getEditorialCityGuide } from "@/lib/editorial-city-guides";
import CityGuideView from "./CityGuideView";

type CityPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EDITORIAL_CITY_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getEditorialCityGuide(slug);
  if (!guide) return { title: "城市攻略暂未开放｜旅策" };
  return {
    title: `${guide.city}实用旅行攻略｜旅策`,
    description: `${guide.city}${guide.defaultDays}日可执行路线：每天怎么走、吃什么、删什么，以及排队、雨天和替代方案。`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const guide = getEditorialCityGuide(slug);

  if (!guide) {
    return (
      <main className="unsupported-city-page">
        <div>
          <span>NOT AVAILABLE YET</span>
          <h1>这座城市的完整攻略还没整理好。</h1>
          <p>旅策不会在找不到城市内容时回退到杭州。城市路线、餐厅和来源完成编辑后，才会正式开放。</p>
          <Link href="/">返回已开放城市</Link>
        </div>
      </main>
    );
  }

  return <CityGuideView guide={guide} />;
}
