import { QueryClient } from '@tanstack/react-query';

/**
 * Cấu hình TanStack Query cho app di động.
 *
 * Mấy con số này khác mặc định vì mạng điện thoại khác mạng máy tính:
 * hay chập chờn, hay chuyển giữa wifi và 4G, và người dùng mở lại app
 * liên tục chứ không để một tab chạy cả ngày.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dữ liệu coi là còn tươi trong 1 phút — mở lại app trong vòng đó
      // thì hiện ngay dữ liệu cũ, không nháy loading.
      staleTime: 60 * 1000,
      // Giữ trong bộ nhớ 5 phút sau khi màn hình đóng.
      gcTime: 5 * 60 * 1000,
      // Mạng 4G rớt gói là chuyện thường, thử lại 2 lần.
      retry: 2,
      // Trên di động không có khái niệm "focus cửa sổ" như trình duyệt,
      // để mặc định true sẽ gọi lại API mỗi lần chuyển màn hình.
      refetchOnWindowFocus: false,
    },
    mutations: {
      // KHÔNG tự thử lại mutation. Thử lại POST /orders là đặt hai đơn.
      retry: 0,
    },
  },
});
