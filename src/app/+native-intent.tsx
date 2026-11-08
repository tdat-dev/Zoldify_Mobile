import { duongDanTrongApp } from '@/lib/app-links';

/**
 * expo-router gọi hàm này với nguyên URL hệ điều hành đưa vào (mở app bằng link,
 * hoặc link tới lúc app đang chạy), trước khi tìm route. Link web zoldify.com được
 * đổi sang màn trong app, xem src/lib/app-links.ts.
 *
 * Hàm chạy ngoài app nên không có phiên đăng nhập; cổng đăng nhập của từng màn
 * vẫn chặn như khi bấm trong app. Không được ném lỗi: lỗi ở đây làm app sập ngay
 * lúc mở link, nên lỗi lạ thì về Trang chủ.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    return duongDanTrongApp(path);
  } catch {
    return '/';
  }
}
