/**
 * Quyết định dùng lại link PayOS cũ hay phải xin link mới.
 *
 * Hàm THUẦN: không gọi mạng, không đụng React Native, để test được bằng
 * `npm test` (xem `__tests__/payos-link.test.mts`).
 *
 * Vì sao phải dùng lại link cũ: backend tạo link với `orderCode = id đơn`
 * (`Zoldify_Backend/src/money/payos/payos.service.ts`), mà PayOS không cho hai
 * link cùng orderCode khi link trước còn chờ. Người dùng đóng trang thanh toán
 * rồi bấm trả lại mà app tạo link mới thì PayOS trả lỗi "Mã đơn hàng đã tồn
 * tại" — không có mã QR nào để quét, đơn thì đã tạo rồi.
 */

/** Link ở các trạng thái này quét không được nữa: phải xin link mới. */
const DEAD_STATUS = new Set(['CANCELLED', 'EXPIRED', 'PAID']);

/** Phần của GET /payos/order/:id mà hàm này cần. */
export interface PayosOrderSnapshot {
  paymentStatus?: string | null;
  payos_order_code?: string | null;
}

/** Phần của GET /payos/status/:code mà hàm này cần. */
export interface PayosLinkSnapshot {
  payosStatus?: string | null;
  checkoutUrl?: string | null;
}

/**
 * URL trang thanh toán còn dùng được, hoặc null nếu chưa có / đã chết.
 *
 * `paymentStatus` do backend trả (`pending` | `success` | `failed`); thiếu
 * trường này thì vẫn xét tiếp, vì bản backend cũ không có.
 */
export function pickPayableLink(
  order: PayosOrderSnapshot | null | undefined,
  link: PayosLinkSnapshot | null | undefined,
): string | null {
  if (!order?.payos_order_code) return null;
  if (order.paymentStatus && order.paymentStatus !== 'pending') return null;
  if (!link?.checkoutUrl) return null;
  if (link.payosStatus && DEAD_STATUS.has(link.payosStatus)) return null;
  return link.checkoutUrl;
}
