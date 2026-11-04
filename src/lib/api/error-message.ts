import { isAxiosError } from 'axios';

/**
 * Lấy câu báo lỗi đọc được cho người dùng từ lỗi của một request.
 *
 * Backend NestJS trả `message` là chuỗi, hoặc mảng chuỗi khi ValidationPipe
 * từ chối (vd `["is_default must be a boolean value"]`). Không có `response`
 * nghĩa là request không tới được server: mất mạng, hết giờ, bị huỷ. 500 của
 * NestJS luôn là "Internal server error" tiếng Anh, không đưa ra cho người dùng.
 */
export function apiErrorMessage(
  err: unknown,
  fallback = 'Chưa thực hiện được. Thử lại nhé.',
): string {
  if (isAxiosError(err)) {
    if (err.response?.status === 500) return fallback;
    const msg = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
    if (!err.response) {
      return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.';
    }
  }
  return fallback;
}

/** Server trả 404: thứ đang tìm không còn nữa, bấm Thử lại cũng vô ích. */
export function isNotFoundError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 404;
}

/**
 * Luật thử lại mặc định của query: tối đa 2 lần. 4xx là server đã trả lời dứt
 * khoát (404 không còn, 401 hết phiên), thử lại chỉ bắt người dùng nhìn skeleton
 * thêm 3 giây. Chỉ 408/429 là lỗi tạm nên vẫn thử.
 */
export function shouldRetryQuery(failureCount: number, err: unknown): boolean {
  if (failureCount >= 2) return false;
  const status = isAxiosError(err) ? err.response?.status : undefined;
  if (status === undefined || status === 408 || status === 429) return true;
  return status < 400 || status >= 500;
}
