import { env } from './env';

/**
 * Địa chỉ backend, suy ra từ MỘT gốc đã được `env.ts` validate.
 *
 * REST và WebSocket đi hai lối khác nhau:
 *   REST      -> /api/v1/...   (có global prefix + version)
 *   Socket.IO -> /chat         (Nest KHÔNG áp prefix cho gateway)
 */
export const API_ORIGIN = env.API_ORIGIN;

/**
 * Gốc phục vụ ảnh `/media/*` — tách khỏi API vì backend không serve media.
 * Ảnh upload trả về URL R2 đầy đủ (bỏ qua gốc này); chỉ path tương đối
 * `/media/...` mới ghép với gốc này. Xem `lib/media.ts`.
 */
export const MEDIA_ORIGIN = env.MEDIA_ORIGIN;

/**
 * Gốc web storefront (zoldify.com) — dùng cho link CHIA SẺ ra ngoài app để
 * người nhận mở được trên trình duyệt (route web là `/product/:id`). Cùng host
 * với media nên tái dùng MEDIA_ORIGIN; ở prod `.env.local` trỏ về zoldify.com.
 */
export const WEB_ORIGIN = MEDIA_ORIGIN;

/** Gốc cho mọi request REST. Service chỉ cần viết '/products', '/orders'. */
export const API_URL = `${API_ORIGIN}/api/v1`;

/** Namespace chat của Socket.IO gateway bên backend. */
export const SOCKET_URL = `${API_ORIGIN}/chat`;

/**
 * Scheme dùng cho deep link, phải khớp `scheme` trong app.json.
 * PayOS thanh toán xong sẽ quay về zoldify://payment/return
 */
export const APP_SCHEME = 'zoldify';
