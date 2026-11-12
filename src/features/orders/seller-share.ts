import type { Order } from '@/api';

/**
 * Hai trường backend chỉ thêm cho người bán (GET /orders?as=seller), chưa có
 * trong schema sinh tự động của app.
 */
type SellerOrder = Order & { seller_total?: number | string; multi_seller?: boolean };

/**
 * Tiền hàng phần của người bán đang xem. Danh sách có sẵn `seller_total`; chi
 * tiết đơn (GET /orders/:id) đã lọc còn món của người bán nên cộng từ món.
 */
export function sellerSubtotal(order: Order): number {
  const o = order as SellerOrder;
  if (o.seller_total !== undefined) return Number(o.seller_total);
  return (o.items ?? []).reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
}

/**
 * Đơn có hàng của người bán khác (test staging 12/11: người bán thấy cả món và
 * tổng tiền của người kia). Phí giao và tổng cộng của đơn không phải tiền của
 * riêng họ, và backend không cho họ tự huỷ đơn như vậy. Chi tiết đơn không có
 * cờ nên so phần của mình với tiền hàng cả đơn, giống web.
 */
export function isMultiSeller(order: Order): boolean {
  const o = order as SellerOrder;
  if (o.multi_seller !== undefined) return o.multi_seller;
  return sellerSubtotal(order) !== Number(o.total_amount);
}
