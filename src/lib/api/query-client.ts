import { MutationCache, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Alert } from 'react-native';

import { apiErrorMessage } from './error-message';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Màn hình gọi mutation này đã tự hiện lỗi; bộ báo lỗi chung bỏ qua. */
      handlesError?: boolean;
    };
  }
}

/**
 * Cấu hình TanStack Query cho app di động.
 *
 * Mấy con số này khác mặc định vì mạng điện thoại khác mạng máy tính:
 * hay chập chờn, hay chuyển giữa wifi và 4G, và người dùng mở lại app
 * liên tục chứ không để một tab chạy cả ngày.
 */
export const queryClient = new QueryClient({
  // Báo lỗi CHUNG cho mọi thao tác ghi. Test E2E 30/09 thấy 36 mutation mà
  // chỉ vài màn tự hiện lỗi: sửa địa chỉ, huỷ đơn, "Đã nhận hàng", chat,
  // giỏ, cài đặt shop hỏng thì người dùng chỉ thấy bấm không ăn (lỗi H-09).
  // Màn nào đã tự báo thì đánh dấu `meta: { handlesError: true }`. 401 để
  // client.ts xử lý (xoá phiên, về màn đăng nhập), không báo thêm.
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.handlesError) return;
      if (isAxiosError(error) && error.response?.status === 401) return;
      Alert.alert('Chưa thực hiện được', apiErrorMessage(error));
    },
  }),
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
