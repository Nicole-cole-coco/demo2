type PublicSource = {
  title?: string;
  url?: string;
  queriedAt?: string;
};

export type PublicHighlight = {
  ticketReference?: string;
  ticketSource?: PublicSource;
  ticketCheckedAt?: string;
  priceType?: string;
  openingHours?: string;
  openingSource?: PublicSource;
  openingCheckedAt?: string;
  bookingNote?: string;
  bookingSource?: PublicSource;
  bookingCheckedAt?: string;
};

type PublicBudgetItem = { category: string; amount: string; percent: number };

const UNRELIABLE_VALUE = /待配置|待搜索|待核验|未知|暂无|不确定|AI预算估算|AI估算/i;
const RELIABLE_PRICE_TYPES = new Set(["官方公开价", "联网搜索参考价"]);

function hasReliableSource(source?: PublicSource, checkedAt?: string) {
  if (!source?.title?.trim() || !/^https?:\/\//i.test(source.url?.trim() ?? "") || !checkedAt) return false;
  return !Number.isNaN(new Date(checkedAt).getTime());
}

function hasUsableValue(value?: string) {
  return Boolean(value?.trim()) && !UNRELIABLE_VALUE.test(value ?? "");
}

export function canShowTicketPrice(item: PublicHighlight) {
  const reference = item.ticketReference?.trim() ?? "";
  const containsPrice = /(?:[¥￥]\s*\d|\d+(?:\.\d+)?\s*元|免费|免票)/.test(reference);
  const isZeroPlaceholder = /(?:^|\D)0(?:\.0+)?\s*元/.test(reference) && !/免费|免票/.test(reference);

  return hasUsableValue(reference)
    && containsPrice
    && !isZeroPlaceholder
    && RELIABLE_PRICE_TYPES.has(item.priceType ?? "")
    && hasReliableSource(item.ticketSource, item.ticketCheckedAt);
}

export function canShowOpeningInfo(item: PublicHighlight) {
  return hasUsableValue(item.openingHours)
    && hasReliableSource(item.openingSource, item.openingCheckedAt);
}

export function canShowBookingInfo(item: PublicHighlight) {
  return hasUsableValue(item.bookingNote)
    && hasReliableSource(item.bookingSource, item.bookingCheckedAt);
}

export function visibleBudgetItems(items: PublicBudgetItem[], hasReliableTicketData: boolean) {
  if (hasReliableTicketData) return items;
  const visible = items.filter((item) => !/门票|体验/.test(item.category));
  const total = visible.reduce((sum, item) => sum + Math.max(item.percent, 0), 0);
  if (!total || total === 100) return visible;

  let allocated = 0;
  return visible.map((item, index) => {
    const percent = index === visible.length - 1
      ? 100 - allocated
      : Math.round((Math.max(item.percent, 0) / total) * 100);
    allocated += percent;
    return {
      ...item,
      percent,
      amount: item.amount.replace(/约占全程预算\s*\d+%/, `约占全程预算 ${percent}%`),
    };
  });
}

export function publicBudgetCategory(category: string) {
  if (/住宿/.test(category)) return "住宿参考";
  if (/餐饮/.test(category)) return "餐饮参考";
  if (/市内交通|交通/.test(category)) return "市内交通参考";
  if (/门票|体验/.test(category)) return "体验与门票";
  if (/机动/.test(category)) return "机动预算";
  return category;
}

export function publicFacingText(value: string) {
  return value
    .replace(/当前未使用实时接口，所有动态信息均待核验。?/g, "营业、收费与预约信息请在出发前通过官方渠道确认。")
    .replace(/动态事实未联网时统一标记出发前待核验。?/g, "营业与收费信息请在出发前通过官方渠道确认。")
    .replace(/预置城市资料/g, "城市资料")
    .replace(/预置资料/g, "城市资料")
    .replace(/AI预算估算/g, "参考预算");
}
