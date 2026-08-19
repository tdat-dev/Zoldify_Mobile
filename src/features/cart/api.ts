import { useQuery } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, Cart, Paginated } from '@/api';
import { useAuthStore } from '@/features/auth/store';

export const cartKeys = {
  all: ['cart'] as const,
  count: () => [...cartKeys.all, 'count'] as const,
};

/**
 * Số món trong giỏ — nguồn thật cho badge trên header (giống CartContext web:
 * ưu tiên meta.total, không có thì cộng dồn quantity). Chỉ gọi khi đã đăng
 * nhập; khách luôn là 0. Giỏ đổi chậm nên giữ tươi 30s.
 */
export function useCartCount() {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: cartKeys.count(),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<Cart>>>('/cart', {
        params: { currentPage: 1, limit: 100 },
      });
      const data = res.data.data;
      const total = data?.meta?.total;
      if (typeof total === 'number') return total;
      return (data?.result ?? []).reduce(
        (acc, item) => acc + ((item as { quantity?: number }).quantity ?? 1),
        0,
      );
    },
    enabled: signedIn,
    staleTime: 30_000,
  });
}
