import { router } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';

/**
 * Cổng hành động cần đăng nhập. Khách xem/tìm sản phẩm thoải mái, nhưng khi
 * bấm mua/bán/giỏ/chat thì gọi hàm này: đã đăng nhập -> chạy action; chưa
 * thì mở luồng đăng nhập (welcome). Trả về true nếu action đã chạy.
 */
export function useRequireAuth() {
  const status = useAuthStore((s) => s.status);

  return (action?: () => void): boolean => {
    if (status === 'signedIn') {
      action?.();
      return true;
    }
    router.push('/welcome');
    return false;
  };
}
