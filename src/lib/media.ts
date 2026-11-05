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

/**
 * Ảnh thu nhỏ 480px (WebP) của một ảnh Zoldify, cho lưới và danh sách.
 *
 * Ảnh gốc là PNG 1,1-1,6 MB trong khi ô sản phẩm chỉ rộng ~400px: trang chủ
 * tải ~20 MB, máy ảo mạng chậm đo được ~80 giây mỗi ảnh và 32 ảnh hỏng giữa
 * chừng (28/10). Backend lưu kèm bản `<tên>_480.webp` cạnh mỗi ảnh tải lên
 * (script bù cho ảnh cũ), nên ở đây chỉ cần đổi đuôi.
 *
 * Chỉ áp cho ảnh trên miền zoldify.com: avatar Google (lh3...) và ảnh ngoài
 * giữ nguyên. Ảnh chưa có bản nhỏ thì 404, `useRemoteImage` tự lùi về ảnh gốc.
 */
export function thumbUrl(path?: string | null): string | undefined {
  const url = mediaUrl(path);
  if (!url) return undefined;
  const m = /^https?:\/\/([^/?#]+)([^?#]*)$/.exec(url);
  if (!m || !/(^|\.)zoldify\.com$/i.test(m[1])) return url;
  if (/_480\.webp$/i.test(m[2]) || !/\.(png|jpe?g|webp)$/i.test(m[2])) return url;
  return url.replace(/\.(png|jpe?g|webp)$/i, '_480.webp');
}
