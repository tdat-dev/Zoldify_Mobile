import type { Href } from 'expo-router';

/**
 * Bấm vào một thông báo thì mở màn nào. MỘT chỗ duy nhất cho cả push (FCM,
 * giá trị trong `data` là chuỗi) lẫn danh sách trong màn Thông báo.
 *
 * Trước đây hai nơi mỗi nơi một bản chép tay: thêm `view=seller` cho đơn mới
 * của người bán chỉ sửa ở push, còn bấm trong màn Thông báo vẫn mở màn đơn
 * MUA, không có nút xác nhận (thấy khi test máy ảo 05/10, lỗi H-02).
 */
export function notificationRoute(
  type: string,
  data: Record<string, unknown> | null | undefined,
): Href | null {
  const d = data ?? {};
  const orderId = d.order_id ?? d.orderId;
  const productId = d.product_id ?? d.productId;
  if (type === 'order_status') {
    // Đơn mới gửi cho NGƯỜI BÁN mang view=seller: mở màn Đơn bán.
    if (d.view === 'seller') {
      return (orderId ? `/sales/${String(orderId)}` : '/sales') as Href;
    }
    return orderId
      ? { pathname: '/orders/[id]', params: { id: String(orderId) } }
      : '/orders';
  }
  if (type === 'message') return '/messages';
  if (type === 'payment') return '/orders';
  if (type === 'new_product' && productId) {
    return { pathname: '/products/[id]', params: { id: String(productId) } };
  }
  return null;
}
