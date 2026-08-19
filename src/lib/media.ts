import { API_ORIGIN } from './config';

/**
 * Đổi đường dẫn ảnh tương đối của backend (`/media/...`) thành URL tuyệt đối
 * để hiển thị. Ảnh đã là URL đầy đủ (http/https) thì giữ nguyên; null/rỗng ->
 * undefined để component tự hiện ô trống.
 */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
