import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import { timeAgo } from '@/lib/format';
import type { ApiResponse, Paginated } from '@/api';
import { useAuthStore } from '@/features/auth/store';
import { productKeys } from '@/features/products/api';

/**
 * Đánh giá THẬT từ backend (/interactions).
 *
 * Thay cho mock.ts + store.ts (lỗi H-01 test E2E 30/09): trước đây điểm sao, số
 * đánh giá, "đã bán", "% phản hồi" là số sinh ngẫu nhiên theo id, còn đánh giá
 * người dùng viết chỉ lưu trên máy, không bao giờ lên server. Giờ:
 *  - điểm và số lượt của sản phẩm: \`product.rating_avg\`, \`product.review_count\`
 *    (backend giữ sẵn, cập nhật mỗi lần đánh giá đổi);
 *  - uy tín người bán: GET /interactions/seller/:id/stats;
 *  - danh sách đánh giá: GET /interactions/product/:id (công khai);
 *  - viết đánh giá: POST /interactions, backend chỉ nhận khi đơn ĐÃ GIAO.
 * "% phản hồi" bỏ hẳn: không có dữ liệu nào đứng sau con số đó.
 */

/** Một đánh giá như backend trả (GET /interactions/product/:id). */
interface ReviewDto {
  id: number;
  rating: number;
  comment: string | null;
  images: string[] | null;
  created_at: string;
  user: { id: number; full_name: string; avatar?: string | null } | null;
  product?: { id: number } | null;
}

/** Dạng hiển thị cho ReviewCard. */
export interface ReviewView {
  id: number;
  author: string;
  avatar?: string | null;
  rating: number;
  comment: string;
  timeLabel: string;
  photos?: string[];
  /** Đánh giá của chính người đang xem. */
  mine?: boolean;
}

export interface SellerStats {
  rating: number;
  review_count: number;
  sold_count: number;
}

export const reviewKeys = {
  all: ['reviews'] as const,
  product: (id: number, limit: number) => [...reviewKeys.all, 'product', id, limit] as const,
  seller: (id: number) => [...reviewKeys.all, 'seller', id] as const,
  mine: () => [...reviewKeys.all, 'mine'] as const,
};

function toView(r: ReviewDto, meId?: number): ReviewView {
  const ago = timeAgo(r.created_at);
  return {
    id: r.id,
    author: r.user?.full_name || 'Người mua',
    avatar: r.user?.avatar ?? null,
    rating: r.rating,
    comment: r.comment ?? '',
    timeLabel: ago && ago !== 'vừa xong' && !ago.includes('/') ? `${ago} trước` : ago,
    photos: r.images?.length ? r.images : undefined,
    mine: meId != null && r.user?.id === meId,
  };
}

/**
 * Đánh giá của một sản phẩm, mới nhất trước. \`average\`/\`total\` lấy từ meta
 * của backend (tính trên TOÀN BỘ đánh giá, không chỉ trang đang tải).
 */
export function useProductReviews(productId: number, limit = 50) {
  const meId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: reviewKeys.product(productId, limit),
    queryFn: async () => {
      const res = await http.get<
        ApiResponse<Paginated<ReviewDto> & { meta: { total: number; average_rating: number } }>
      >(`/interactions/product/${productId}`, { params: { currentPage: 1, limit } });
      const d = res.data.data;
      return {
        average: Number(d.meta.average_rating ?? 0),
        total: Number(d.meta.total ?? 0),
        reviews: (d.result ?? []).map((r) => toView(r, meId)),
      };
    },
    enabled: Number.isFinite(productId) && productId > 0,
  });
}

/** Uy tín người bán: điểm theo lượt đánh giá, số đánh giá, số món đã giao. */
export function useSellerStats(sellerId?: number) {
  return useQuery({
    queryKey: reviewKeys.seller(sellerId ?? 0),
    queryFn: async () => {
      const res = await http.get<ApiResponse<SellerStats>>(`/interactions/seller/${sellerId}/stats`);
      return res.data.data;
    },
    enabled: !!sellerId,
    staleTime: 60_000,
  });
}

/** Các sản phẩm tôi đã đánh giá (để hiện "Đã đánh giá" ở chi tiết đơn). */
export function useMyReviewedProducts() {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: reviewKeys.mine(),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<ReviewDto>>>('/interactions', {
        params: { mine: 1, currentPage: 1, limit: 100 },
      });
      return new Set((res.data.data.result ?? []).map((r) => r.product?.id).filter((x): x is number => !!x));
    },
    enabled: signedIn,
  });
}

/** Gửi đánh giá. Backend từ chối nếu đơn chưa giao hoặc đã đánh giá món này. */
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    meta: { handlesError: true },
    mutationFn: async (input: {
      product_id: number;
      order_id: number;
      rating: number;
      comment?: string;
      images?: string[];
    }) => {
      const res = await http.post<ApiResponse<ReviewDto>>('/interactions', input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
      // Điểm và số lượt nằm trên product: tải lại cho thẻ và trang chi tiết.
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
