import { Platform } from 'react-native';
import { z } from 'zod';

/**
 * Biến môi trường, validate MỘT lần lúc khởi động.
 *
 * Trước đây `config.ts` đọc `process.env` thẳng — thiếu/sai biến thì lỗi
 * mơ hồ tận lúc gọi API. Ở đây parse bằng zod: sai là ném ngay, ngay khi
 * mở app, kèm thông báo chỉ đúng chỗ cần sửa.
 *
 * BẪY MÁY ẢO ANDROID: trong emulator, `localhost` là chính máy ảo chứ
 * không phải máy tính. Backend chạy trên máy tính phải gọi bằng 10.0.2.2.
 * Máy thật dùng IP LAN (192.168.1.x). iOS simulator dùng localhost được.
 */
const DEV_FALLBACK = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

const schema = z.object({
  API_ORIGIN: z
    .string()
    .regex(/^https?:\/\/.+/, 'phải là URL dạng http(s)://...'),
});

const parsed = schema.safeParse({
  API_ORIGIN: process.env.EXPO_PUBLIC_API_ORIGIN ?? DEV_FALLBACK,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.') || 'API_ORIGIN'}: ${i.message}`)
    .join('\n');
  throw new Error(
    `[env] Biến môi trường không hợp lệ:\n${issues}\n` +
      `Sửa EXPO_PUBLIC_API_ORIGIN trong file .env.local (xem README).`,
  );
}

export const env = parsed.data;
