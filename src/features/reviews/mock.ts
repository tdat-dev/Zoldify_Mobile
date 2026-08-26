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
  'Trọng Nghĩa', 'Mỹ Duyên', 'Hoàng Long', 'Thanh Trúc',
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
];

const TIME_LABELS = ['2 ngày trước', '1 tuần trước', '2 tuần trước', '3 tuần trước', '1 tháng trước', '2 tháng trước'];

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
}

/** Vài đánh giá cho một sản phẩm (rating của sản phẩm suy từ đánh giá này). */
export function productReviews(productId?: number, n = 3): MockReview[] {
  const r = makeRng((productId ?? 1) * 13 + 5);
  // Chọn theo bước nhảy lẻ để KHÔNG trùng tên/nội dung giữa các review liền kề.
  const nameStart = Math.floor(r() * NAMES.length);
  const cmtStart = Math.floor(r() * COMMENTS.length);
  const timeStart = Math.floor(r() * TIME_LABELS.length);
  const out: MockReview[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push({
      id: i + 1,
      author: NAMES[(nameStart + i * 3) % NAMES.length],
      rating: r() > 0.28 ? 5 : 4,
      comment: COMMENTS[(cmtStart + i * 3) % COMMENTS.length],
      timeLabel: TIME_LABELS[(timeStart + i) % TIME_LABELS.length],
    });
  }
  return out;
}

/** Điểm + số đánh giá của một sản phẩm (suy từ id, khớp tinh thần các review). */
export function productRating(productId?: number): { rating: number; count: number } {
  const r = makeRng((productId ?? 1) * 13 + 5);
  return {
    rating: Math.round((4.4 + r() * 0.5) * 10) / 10,
    count: 8 + Math.floor(r() * 160),
  };
}
