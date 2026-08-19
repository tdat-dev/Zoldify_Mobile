import { MEDIA_ORIGIN } from './config';

/**
 * Đổi đường dẫn ảnh tương đối (`/media/...`) thành URL tuyệt đối để hiển thị.
 * Ảnh đã là URL đầy đủ (http/https — vd R2) thì giữ nguyên; null/rỗng ->
 * undefined để component tự hiện ảnh dự phòng.
 *
 * Ghép với MEDIA_ORIGIN, KHÔNG phải API_ORIGIN: backend không serve /media
 * (ảnh do web/CDN phục vụ). Xem `lib/config.ts`.
 */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${MEDIA_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
