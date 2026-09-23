import { Stack } from 'expo-router';

/**
 * Vùng đã đăng nhập. Hiện chỉ bọc nhóm tab; sau này các luồng đẩy chồng
 * (products/[id], checkout, chat/[threadId]…) thêm Stack.Screen ở đây.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
