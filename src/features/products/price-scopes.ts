/**
 * Tầm tiền dùng chung cho "Mọi giá" ở header và bộ lọc ở /search — port đúng
 * PRICE_SCOPES của web (Header.tsx). Ở sàn đồ cũ, câu hỏi đầu tiên là "có gì
 * trong tầm tiền của mình", nên lọc theo giá là bộ lọc chính, không phải phụ.
 */
export interface PriceScope {
  key: string;
  label: string;
  price_min?: number;
  price_max?: number;
}

export const PRICE_SCOPES: PriceScope[] = [
  { key: 'any', label: 'Mọi giá' },
  { key: 'under100k', label: 'Dưới 100k', price_max: 100_000 },
  { key: '100to300k', label: '100k – 300k', price_min: 100_000, price_max: 300_000 },
  { key: '300kto1m', label: '300k – 1 triệu', price_min: 300_000, price_max: 1_000_000 },
  { key: 'over1m', label: 'Trên 1 triệu', price_min: 1_000_000 },
];

/** Tìm nhãn tầm tiền khớp cặp min/max hiện có (để hiện lại trên chip). */
export function labelForPrice(min?: number, max?: number): string {
  const s = PRICE_SCOPES.find((x) => (x.price_min ?? undefined) === min && (x.price_max ?? undefined) === max);
  return s ? s.label : 'Mọi giá';
}
