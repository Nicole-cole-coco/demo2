const CHINA_TIME_OFFSET_MS = 8 * 60 * 60 * 1000;

function toChinaTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getTime() + CHINA_TIME_OFFSET_MS);
}

/**
 * 使用固定的 UTC+8 规则格式化，避免 SSR 与浏览器时区、语言环境不同造成文本不一致。
 */
export function formatChinaDateTime(value?: string | null) {
  const chinaTime = toChinaTime(value);
  if (!chinaTime) return "";

  const month = chinaTime.getUTCMonth() + 1;
  const day = chinaTime.getUTCDate();
  const hour = String(chinaTime.getUTCHours()).padStart(2, "0");
  const minute = String(chinaTime.getUTCMinutes()).padStart(2, "0");

  return `${month}月${day}日 ${hour}:${minute}`;
}

/**
 * 日期卡片同样固定使用 UTC+8，不依赖运行环境的 locale 或 timezone。
 */
export function formatChinaDate(value?: string | null) {
  const chinaTime = toChinaTime(value);
  if (!chinaTime) return "";

  return `${chinaTime.getUTCMonth() + 1}月${chinaTime.getUTCDate()}日`;
}
