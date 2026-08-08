import { Platform } from 'react-native';

/**
 * Địa chỉ backend.
 *
 * Khai đúng một biến là gốc của backend rồi suy ra hai đường, giống hệt
 * bên web — vì REST và WebSocket đi hai lối khác nhau:
 *   REST      -> /api/v1/...   (có global prefix + version)
 *   Socket.IO -> /chat         (Nest KHÔNG áp prefix cho gateway)
 *
 * BẪY KHI CHẠY MÁY ẢO ANDROID: trong emulator, `localhost` là chính cái
 * máy ảo đó chứ không phải máy tính của bạn. Backend chạy trên máy tính
 * phải gọi bằng 10.0.2.2. Máy thật cắm cáp/wifi thì dùng IP LAN của máy
 * tính (ví dụ 192.168.1.x). iOS simulator thì localhost dùng được.
 */
const DEV_FALLBACK = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export const API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN ?? DEV_FALLBACK;

/** Gốc cho mọi request REST. Service chỉ cần viết '/products', '/orders'. */
export const API_URL = `${API_ORIGIN}/api/v1`;

/** Namespace chat của Socket.IO gateway bên backend. */
export const SOCKET_URL = `${API_ORIGIN}/chat`;

/**
 * Scheme dùng cho deep link, phải khớp `scheme` trong app.json.
 * PayOS thanh toán xong sẽ quay về zoldify://payment/return
 */
export const APP_SCHEME = 'zoldify';
