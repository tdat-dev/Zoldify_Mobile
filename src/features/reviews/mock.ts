/**
 * Dữ liệu đánh giá / uy tín GIẢ LẬP cho đồ án (BE chưa có review). Suy từ id
 * bằng PRNG tất định (LCG) → mỗi sản phẩm/người bán luôn ra cùng số liệu, không
 * nhấp nháy giữa các lần render. Khi BE có review thật thì thay lớp này bằng API.
 */

function makeRng(seed: number) {
  let s = (Math.abs(Math.floor(seed)) * 2654435761 + 12345) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const NAMES = [
  'Minh Anh', 'Thu Hà', 'Quốc Bảo', 'Ngọc Mai', 'Tuấn Kiệt', 'Lan Phương',
  'Đức Huy', 'Hải Yến', 'Gia Bảo', 'Khánh Linh', 'Bình An', 'Phương Thảo',
  'Trọng Nghĩa', 'Mỹ Duyên', 'Hoàng Long', 'Thanh Trúc', 'Nhật Nam', 'Kim Chi',
];

const COMMENTS = [
  'Hàng đẹp đúng như mô tả, người bán nhiệt tình.',
  'Đóng gói kỹ, giao nhanh. Sẽ ủng hộ tiếp!',
  'Chất lượng ổn trong tầm giá, dùng còn tốt.',
  'Y như hình, cảm ơn shop nha.',
  'Món này còn mới, giá hợp lý. Recommend.',
  'Giao đúng hẹn, tư vấn dễ thương.',
  'Ưng nha, sạch sẽ như mới.',
  'Ok trong tầm giá, có vài vết nhỏ nhưng không đáng kể.',
  'Shop trả lời tin nhắn nhanh, đóng gói cẩn thận.',
  'Dùng vài hôm thấy ổn áp, đáng tiền.',
];

const TIME_LABELS = ['2 ngày trước', '1 tuần trước', '2 tuần trước', '3 tuần trước', '1 tháng trước', '2 tháng trước'];

/** Ảnh đánh giá giả lập — picsum seeded (tất định), tải trực tiếp qua expo-image. */
function photo(seed: number): string {
  return `https://picsum.photos/seed/zr${Math.abs(Math.floor(seed))}/400/400`;
}

export interface SellerStats {
  rating: number;
  reviewCount: number;
  soldCount: number;
  responseRate: number;
}

/** Uy tín người bán (rating, số đánh giá, đã bán, tỉ lệ phản hồi). */
export function sellerStats(sellerId?: number): SellerStats {
  const r = makeRng((sellerId ?? 1) * 7 + 3);
  return {
    rating: Math.round((4.3 + r() * 0.6) * 10) / 10,
    reviewCount: 18 + Math.floor(r() * 320),
    soldCount: 25 + Math.floor(r() * 640),
    responseRate: 90 + Math.floor(r() * 10),
  };
}

export interface MockReview {
  id: number;
  author: string;
  rating: number;
  comment: string;
  timeLabel: string;
  photos?: string[];
  /** Đánh giá do người dùng vừa gửi (lưu cục bộ) — để đánh dấu "Bạn". */
  mine?: boolean;
}

/**
 * Danh sách đánh giá cho một sản phẩm. `n` review, một số kèm ảnh. Chọn theo
 * bước nhảy lẻ để không trùng tên/nội dung giữa các review liền kề.
 */
export function productReviews(productId?: number, n = 12): MockReview[] {
  const base = (productId ?? 1) * 13 + 5;
  const r = makeRng(base);
  const nameStart = Math.floor(r() * NAMES.length);
  const cmtStart = Math.floor(r() * COMMENTS.length);
  const timeStart = Math.floor(r() * TIME_LABELS.length);
  const out: MockReview[] = [];
  for (let i = 0; i < n; i += 1) {
    const hasPhoto = r() > 0.55; // ~45% review có ảnh
    const photoCount = hasPhoto ? 1 + Math.floor(r() * 3) : 0;
    const photos = photoCount
      ? Array.from({ length: photoCount }, (_, k) => photo(base * 31 + i * 7 + k))
      : undefined;
    out.push({
      id: i + 1,
      author: NAMES[(nameStart + i * 5) % NAMES.length],
      rating: r() > 0.24 ? 5 : 4,
      comment: COMMENTS[(cmtStart + i * 3) % COMMENTS.length],
      timeLabel: TIME_LABELS[(timeStart + i) % TIME_LABELS.length],
      photos,
    });
  }
  return out;
}

/** Điểm + số đánh giá của một sản phẩm (suy từ id). */
export function productRating(productId?: number): { rating: number; count: number } {
  const r = makeRng((productId ?? 1) * 13 + 5);
  return {
    rating: Math.round((4.4 + r() * 0.5) * 10) / 10,
    count: 8 + Math.floor(r() * 160),
  };
}

/** Phân bố số sao (5→1) cho thanh breakdown, tổng = count, dồn về 5/4 sao. */
export function ratingBreakdown(productId?: number): Record<1 | 2 | 3 | 4 | 5, number> {
  const { count } = productRating(productId);
  const w = { 5: 0.68, 4: 0.2, 3: 0.07, 2: 0.03, 1: 0.02 };
  const five = Math.round(count * w[5]);
  const four = Math.round(count * w[4]);
  const three = Math.round(count * w[3]);
  const two = Math.round(count * w[2]);
  const one = Math.max(0, count - five - four - three - two);
  return { 5: five, 4: four, 3: three, 2: two, 1: one };
}
