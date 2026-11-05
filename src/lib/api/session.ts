import type { QueryClient } from '@tanstack/react-query';

/**
 * 401 này có phải phiên đang lưu bị server từ chối không. Chỉ đúng khi request
 * mang ĐÚNG token đang lưu:
 *
 * - Không mang token: khách, sai mật khẩu, hoặc lệnh gỡ push token đi ra sau khi
 *   token đã bị xoá. Không có phiên nào để mất. Coi đó là hết phiên từng làm
 *   xoá cache lần hai đúng lúc màn đang tải lại, màn đứng ở skeleton mãi.
 * - Mang token khác token đang lưu: request bay từ phiên cũ về muộn sau khi đã
 *   đăng nhập tài khoản khác, hoặc phiên đã xoá rồi (D-24, E2E 02/11).
 */
export function isSessionRejected(authorization: unknown, current: string | null): boolean {
  const sent = String(authorization ?? '').replace(/^Bearer\s+/i, '');
  return !!sent && sent === current;
}

/**
 * Bỏ mọi dữ liệu của phiên vừa kết thúc, để người sau không thấy dữ liệu người
 * trước. Gọi SAU khi đổi trạng thái đăng nhập và đã bỏ token.
 *
 * KHÔNG dùng queryClient.clear(): nó gỡ query khỏi cache nhưng observer của màn
 * đang mở vẫn bám vào query đã huỷ, không ai báo cho nó, fetch đang chạy thì bị
 * huỷ im lặng. Màn đứng ở isPending cho tới khi tình cờ render lại. resetQueries
 * cũng xoá sạch dữ liệu nhưng báo cho observer và tải lại những query đang bật.
 */
export function resetSessionCache(client: QueryClient) {
  client.getMutationCache().clear();
  client.removeQueries({ predicate: (query) => query.getObserversCount() === 0 });
  void client.resetQueries();
}
