import type { ProductFilters } from '@/features/products/api';
import { PRICE_SCOPES } from '@/features/products/price-scopes';

/**
 * Nhãn tình trạng dùng CHUNG (trước đây nhân đôi ở product-card và product-detail).
 * Khớp đúng giá trị `condition` mà form Đăng bán ghi xuống + BE lưu.
 */
export const CONDITION_LABEL: Record<string, string> = {
  new: 'Mới',
  like_new: 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
  used: 'Đã dùng',
  refurbished: 'Tân trang',
};

/** Món còn "tươi" — dùng để tô badge xanh ở card/detail. */
export function isFreshCondition(condition?: string): boolean {
  return condition === 'new' || condition === 'like_new';
}

/** Thứ tự tình trạng cho bộ lọc (single-select, khớp BE so bằng). */
export const CONDITION_ORDER = ['new', 'like_new', 'good', 'fair', 'used', 'refurbished'] as const;

/**
 * Sắp xếp — chỉ liệt kê value BE thật sự hiểu (queryProductList). "newest" là
 * mặc định nên coi như không set (giữ query-key gọn, cache trùng với feed).
 */
export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'best_selling', label: 'Bán chạy' },
];

export const DEFAULT_SORT = 'newest';

/** Trạng thái lọc/sắp xếp dùng chung cho Search + Category. */
export interface ProductQuery {
  sort: string;
  price_min?: number;
  price_max?: number;
  condition?: string;
}

export const EMPTY_QUERY: ProductQuery = { sort: DEFAULT_SORT };

/** Số bộ lọc đang bật (không tính sort mặc định) — để hiện badge trên nút Lọc. */
export function countActiveFilters(q: ProductQuery): number {
  let n = 0;
  if (q.price_min != null || q.price_max != null) n += 1;
  if (q.condition) n += 1;
  return n;
}

/** Có đổi gì so với mặc định không (kể cả sort) — để tô nút và cho phép "Xoá". */
export function isDefaultQuery(q: ProductQuery): boolean {
  return q.sort === DEFAULT_SORT && countActiveFilters(q) === 0;
}

/** Nhãn tầm tiền hiện tại (khớp PRICE_SCOPES), rỗng nếu "Mọi giá". */
export function priceScopeKey(q: ProductQuery): string {
  const s = PRICE_SCOPES.find(
    (x) => (x.price_min ?? undefined) === q.price_min && (x.price_max ?? undefined) === q.price_max,
  );
  return s?.key ?? 'any';
}

/**
 * Đổi ProductQuery -> ProductFilters gửi API. Bỏ sort mặc định và field rỗng
 * để query-key không sinh biến thể thừa.
 */
export function toProductFilters(q: ProductQuery, base?: ProductFilters): ProductFilters {
  const f: ProductFilters = { ...base };
  if (q.sort && q.sort !== DEFAULT_SORT) f.sort = q.sort;
  if (q.price_min != null) f.price_min = q.price_min;
  if (q.price_max != null) f.price_max = q.price_max;
  if (q.condition) f.condition = q.condition;
  return f;
}
