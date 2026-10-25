import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, CreateOrderDto, Order, Paginated, Payment } from '@/api';
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
    // Cả khi lỗi: đặt hỏng thường vì hết hàng/đổi giá, giỏ phải lấy lại cho đúng.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/**
 * Trả một đơn bằng ví Zoldify (POST /payments). Tạo đơn với payment_method
 * 'wallet' KHÔNG trừ tiền: chỉ bước này mới trừ ví, tách ký quỹ và chuyển đơn
 * sang "Đã xác nhận". Thiếu số dư hay đơn vừa đổi trạng thái (409) thì đơn vẫn
 * còn nhưng chưa trả, người mua trả lại ở màn chi tiết đơn.
 */
export function usePayOrderWithWallet() {
  const qc = useQueryClient();
  return useMutation({
    meta: { handlesError: true },
    mutationFn: async (orderId: number) => {
      const res = await http.post<ApiResponse<Payment>>('/payments', {
        order_id: orderId,
        payment_method: 'wallet',
      });
      return res.data.data;
    },
    // Trả được hay không thì trạng thái đơn trên server cũng có thể đã đổi.
    onSettled: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
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
    // Cả khi lỗi (vd 409: người bán vừa đổi trạng thái) để màn hiện đúng trạng thái mới.
    onSettled: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
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
    onSettled: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

/* ── Phía NGƯỜI BÁN (màn Đơn bán, lỗi H-02 test E2E) ─────────────────────── */

export const saleKeys = {
  all: ['sales'] as const,
  list: () => [...saleKeys.all, 'list'] as const,
};

/** Đơn có hàng của tôi (GET /orders?as=seller). Cần đăng nhập. */
export function useSellerOrders() {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: saleKeys.list(),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<Order>>>('/orders', {
        params: { currentPage: 1, limit: 50, as: 'seller' },
      });
      return res.data.data.result ?? [];
    },
    enabled: signedIn,
  });
}

/** Làm mới cả danh sách đơn bán lẫn chi tiết đơn sau mỗi thao tác của người bán. */
function useInvalidateSale() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: saleKeys.all });
    qc.invalidateQueries({ queryKey: orderKeys.all });
  };
}

/** Người bán xác nhận đơn. Server tạo vận đơn GHN ngay lúc này. */
export function useConfirmSale() {
  const done = useInvalidateSale();
  return useMutation({
    mutationFn: async (id: number) => {
      await http.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status: 'confirmed' });
      return id;
    },
    onSuccess: done,
  });
}

/** Người bán huỷ đơn (khi còn Chờ xác nhận / Đã xác nhận). Server hoàn kho. */
export function useCancelSale() {
  const done = useInvalidateSale();
  return useMutation({
    mutationFn: async (id: number) => {
      await http.patch<ApiResponse<unknown>>(`/orders/${id}/cancel-sale`);
      return id;
    },
    onSuccess: done,
  });
}

/** Tạo lại vận đơn GHN đã bị từ chối (sau khi sửa địa chỉ lấy hàng). */
export function useRetryShipments() {
  const done = useInvalidateSale();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await http.post<ApiResponse<OrderShipment[]>>(`/orders/${id}/shipments/retry`);
      return res.data.data;
    },
    onSuccess: done,
  });
}

/**
 * GHN sandbox không có shipper thật: giả lập GHN đã lấy hàng để đơn sang
 * "Đang giao". Server chỉ cho chạy khi GHN_HOST là sandbox.
 */
export function useSimulatePickup() {
  const done = useInvalidateSale();
  return useMutation({
    mutationFn: async (id: number) => {
      await http.patch<ApiResponse<unknown>>(`/orders/${id}/sim-ghn`, { phase: 'shipping' });
      return id;
    },
    onSuccess: done,
  });
}
