import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, CreateOrderDto, Order, Paginated } from '@/api';
import { useAuthStore } from '@/features/auth/store';
import { cartKeys } from '@/features/cart/api';

/** Phí ship theo TỪNG người bán cho một địa chỉ nhận (GHN tách vận đơn). */
export interface ShippingQuoteItem {
  seller_id: number;
  seller_name: string;
  fee: number;
  has_pickup: boolean;
  error?: string;
}
export interface ShippingQuote {
  /**
   * false khi có người bán GHN không tính được phí (phần đó fee = 0 kèm error).
   * Số 0 lúc đó là "chưa biết", KHÔNG phải miễn phí. Backend cũ không có trường
   * này, nên nơi dùng vẫn phải xét thêm `items[].error`.
   */
  ok?: boolean;
  total: number;
  items: ShippingQuoteItem[];
}

/** Vận đơn GHN của một người bán trong đơn (GET /orders/:id đính kèm). */
export interface OrderShipment {
  id: number;
  status: 'created' | 'failed' | 'delivered' | 'received';
  tracking_code: string | null;
  /** Lý do GHN từ chối, khi status = failed. */
  error: string | null;
  seller?: { id: number; full_name?: string };
}

/** Chi tiết đơn kèm vận đơn (schema OpenAPI chưa khai trường này). */
export type OrderDetail = Order & { shipments?: OrderShipment[] };

export const orderKeys = {
  all: ['orders'] as const,
  list: (status?: string) => [...orderKeys.all, 'list', status ?? 'all'] as const,
  detail: (id: number) => [...orderKeys.all, 'detail', id] as const,
};

/** Danh sách đơn của tôi, lọc theo trạng thái (rỗng = tất cả). Cần đăng nhập. */
export function useOrders(status?: string) {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: orderKeys.list(status),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<Order>>>('/orders', {
        params: { currentPage: 1, limit: 50, status },
      });
      return res.data.data.result ?? [];
    },
    enabled: signedIn,
  });
}

/** Chi tiết một đơn. */
export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const res = await http.get<ApiResponse<OrderDetail>>(`/orders/${id}`);
      return res.data.data;
    },
    enabled: Number.isFinite(id),
  });
}

/** Báo giá phí ship theo địa chỉ nhận (GHN) — server tính từ pickup người bán. */
export function useShippingQuote() {
  return useMutation({
    meta: { handlesError: true },
    mutationFn: async (input: {
      to_district_id: number;
      to_ward_code: string;
      cart_item_ids?: number[];
    }) => {
      const res = await http.post<ApiResponse<ShippingQuote>>('/orders/shipping-quote', input);
      return res.data.data;
    },
  });
}

/** Tạo đơn (thật). Làm mới giỏ + danh sách đơn sau khi đặt. */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    meta: { handlesError: true },
    mutationFn: async (dto: CreateOrderDto) => {
      const res = await http.post<ApiResponse<Order>>('/orders', dto);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/** Người mua huỷ đơn (khi còn cho phép). */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await http.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

/** Người mua xác nhận đã nhận hàng của MỘT người bán trong đơn (giải ngân). */
export function useConfirmReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { orderId: number; sellerId: number }) => {
      await http.patch<ApiResponse<unknown>>(
        `/orders/${input.orderId}/shipments/${input.sellerId}/received`,
      );
      return input;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
