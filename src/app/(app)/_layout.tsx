import { Stack } from 'expo-router';

import { stackLoginGate } from '@/features/auth/components/login-gate';

/**
 * Vùng chính của app: nhóm tab và các màn đẩy chồng. Khách lướt sản phẩm, shop,
 * tìm kiếm thoải mái; route cần tài khoản (xem auth/guest-access.ts) qua cổng
 * đăng nhập ở `screenLayout`, nên không màn nào phải tự xử lý khách.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} screenLayout={stackLoginGate}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
