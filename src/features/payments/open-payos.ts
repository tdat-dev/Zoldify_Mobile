import { router } from 'expo-router';

/**
 * Mở trang thanh toán PayOS NGAY TRONG app (màn `pay` bọc WebView), không đẩy
 * người dùng sang trình duyệt.
 *
 * Trước đây app dùng `openBrowserAsync` (Custom Tab): người dùng rời app, trả
 * tiền xong phải tự bấm X để quay lại, và app không biết họ đã trả hay chưa.
 * WebView giữ họ trong app, màn thanh toán tự hỏi trạng thái đơn và tự đóng khi
 * PayOS báo đã trả.
 */
export interface PayosWebTarget {
  /** Trang `pay.payos.vn` lấy từ POST /payos/create-link hoặc link cũ còn sống. */
  url: string;
  kind: 'order' | 'topup';
  /** Đơn đang trả (chỉ có khi `kind === 'order'`): dùng để hỏi trạng thái. */
  orderId?: number;
  /**
   * `replace`: thay màn hiện tại bằng trang PayOS (đặt hàng xong — màn checkout
   * đã cũ), đóng thì về chi tiết đơn. `push`: đẩy chồng lên (bấm "Thanh toán
   * bằng PayOS" trong chi tiết đơn / nạp ví), đóng thì quay lại màn cũ.
   */
  mode?: 'push' | 'replace';
}

export function openPayosWeb({ url, kind, orderId, mode = 'push' }: PayosWebTarget): void {
  const params = {
    url,
    kind,
    ...(orderId ? { orderId: String(orderId) } : {}),
    ...(mode === 'replace' ? { from: 'checkout' } : {}),
  };
  if (mode === 'replace') router.replace({ pathname: '/pay', params });
  else router.push({ pathname: '/pay', params });
}
