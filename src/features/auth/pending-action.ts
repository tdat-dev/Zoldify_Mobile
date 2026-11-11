/**
 * Hành động khách ĐÃ bấm nhưng phải đăng nhập mới chạy được (M-01).
 *
 * Trước đây khách bấm "Thêm vào giỏ" thì app chỉ đẩy /login và bỏ cuộc: món
 * không được ghi ở đâu cả (giỏ chỉ nằm trên server, query đang tắt với khách),
 * đăng nhập xong `router.replace('/')` về trang chủ là mất sạch ý định.
 *
 * Giữ lại ý định ở đây (bộ nhớ, cùng phiên chạy app) để `finishLogin` chạy tiếp
 * sau khi có token: thêm món vào giỏ và quay lại đúng màn sản phẩm.
 *
 * Chỉ MỘT nơi được `take` (finishLogin) nên không lo hai màn cùng chạy lại
 * hành động một lần. Bấm thêm lần nữa thì ghi đè — lấy ý định mới nhất.
 */
export type PendingAuthAction =
  | { kind: 'addToCart'; productId: number; quantity: number }
  | { kind: 'buyNow'; productId: number; quantity: number };

let pending: PendingAuthAction | null = null;

/** Ghi lại ý định của khách (thay bản cũ nếu có). */
export function setPendingAuthAction(action: PendingAuthAction): void {
  pending = action;
}

/** Lấy và xoá — gọi một lần khi đăng nhập xong. */
export function takePendingAuthAction(): PendingAuthAction | null {
  const action = pending;
  pending = null;
  return action;
}

/** Xem mà KHÔNG xoá (test/debug). */
export function peekPendingAuthAction(): PendingAuthAction | null {
  return pending;
}
