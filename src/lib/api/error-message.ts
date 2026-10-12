import { isAxiosError } from 'axios';

/**
 * Lấy câu báo lỗi đọc được cho người dùng từ lỗi của một request.
 *
 * Backend NestJS trả `message` là chuỗi, hoặc mảng chuỗi khi ValidationPipe
 * từ chối (vd `["is_default must be a boolean value"]`). Không có `response`
 * nghĩa là request không tới được server: mất mạng, hết giờ, bị huỷ.
 */
export function apiErrorMessage(
  err: unknown,
  fallback = 'Chưa thực hiện được. Thử lại nhé.',
): string {
  if (isAxiosError(err)) {
    const msg = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
    if (!err.response) {
      return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.';
    }
  }
  return fallback;
}
