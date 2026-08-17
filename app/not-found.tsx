import Link from "next/link";

export default function NotFound() {
  return (
    <main className="unsupported-city-page">
      <div>
        <span>404 · NOT AVAILABLE</span>
        <h1>这座城市的完整攻略还没整理好，或链接不存在。</h1>
        <p>旅策不会把未知城市回退成另一座城市。请返回已开放的 50 座城市列表，或重新搜索目的地。</p>
        <Link href="/#cities">返回已开放城市</Link>
      </div>
    </main>
  );
}
