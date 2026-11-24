import { useMutation, useQueryClient } from '@tanstack/react-query';

import { openPayosWeb } from '@/features/payments/open-payos';

import {
  createOrderPayosLink,
  fetchPayosLinkStatus,
  fetchPayosOrderStatus,
  orderKeys,
} from './api';
import { pickPayableLink } from './payos-link';

/**
 * URL trang thanh toán PayOS của một đơn: mã VietQR + số tài khoản + nút mở app
 * ngân hàng — đúng trang mà web chuyển sang khi chọn "Thẻ hoặc QR".
 *
 * Dùng lại link cũ khi còn sống: xem `payos-link.ts` (PayOS từ chối orderCode
 * trùng nên tạo link mới sẽ hỏng).
 */
export async function orderPayosUrl(orderId: number): Promise<string> {
  return (await payableLinkOf(orderId)) ?? (await createOrderPayosLink(orderId)).checkoutUrl;
}

/**
 * Mở trang thanh toán PayOS TRONG app (màn `pay`, WebView) — không còn nhảy sang
 * trình duyệt. Màn đó tự poll trạng thái để đóng khi đơn đã trả.
 */
export async function openOrderPayosCheckout(orderId: number): Promise<void> {
  const url = await orderPayosUrl(orderId);
  openPayosWeb({ url, kind: 'order', orderId });
}

/** Link cũ còn dùng được; lỗi (chưa có link, mạng) coi như không có. */
async function payableLinkOf(orderId: number): Promise<string | null> {
  try {
    const order = await fetchPayosOrderStatus(orderId);
    if (!order?.payos_order_code) return null;
    const link = await fetchPayosLinkStatus(order.payos_order_code);
    return pickPayableLink(order, link);
  } catch {
    return null;
  }
}

/** Nút "Thanh toán bằng PayOS" ở chi tiết đơn: có trạng thái chờ cho nút. */
export function useOpenOrderPayosCheckout() {
  const qc = useQueryClient();
  return useMutation({
    meta: { handlesError: true },
    mutationFn: openOrderPayosCheckout,
    // Tạo link là một thao tác ghi ở server (thêm bản ghi Payment): đọc lại đơn.
    onSettled: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
