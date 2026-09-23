import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, Cart, Paginated } from '@/api';
import { useAuthStore } from '@/features/auth/store';

export const cartKeys = {
  all: ['cart'] as const,
  list: () => [...cartKeys.all, 'list'] as const,
  count: () => [...cartKeys.all, 'count'] as const,
};

/** Đếm số món (ưu tiên meta.total, không có thì cộng dồn quantity). */
function totalOf(data?: Paginated<Cart> | null): number {
  const total = data?.meta?.total;
  if (typeof total === 'number') return total;
  return (data?.result ?? []).reduce((acc, i) => acc + (i.quantity ?? 1), 0);
}

/**
 * Số món trong giỏ — nguồn thật cho badge trên header (giống CartContext web).
 * Chỉ gọi khi đã đăng nhập; khách luôn là 0. Giỏ đổi chậm nên giữ tươi 30s.
 */
export function useCartCount() {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: cartKeys.count(),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<Cart>>>('/cart', {
        params: { currentPage: 1, limit: 100 },
      });
      return totalOf(res.data.data);
    },
    enabled: signedIn,
    staleTime: 30_000,
  });
}

/** Danh sách món trong giỏ (mỗi món kèm nguyên Product). Cần đăng nhập. */
export function useCart() {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: cartKeys.list(),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<Cart>>>('/cart', {
        params: { currentPage: 1, limit: 100 },
      });
      return res.data.data.result ?? [];
    },
    enabled: signedIn,
  });
}

/** Thêm vào giỏ. Làm mới cả danh sách lẫn badge. */
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { product_id: number; quantity?: number }) => {
      const res = await http.post<ApiResponse<Cart>>('/cart', {
        product_id: input.product_id,
        quantity: input.quantity ?? 1,
      });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

/** Đổi số lượng một dòng giỏ (>= 1). */
export function useUpdateCartQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; quantity: number }) => {
      const res = await http.patch<ApiResponse<Cart>>(`/cart/${input.id}`, {
        quantity: input.quantity,
      });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

/** Bỏ một dòng khỏi giỏ. */
export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await http.delete<ApiResponse<unknown>>(`/cart/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}
