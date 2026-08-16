import { Stack } from 'expo-router';

/** Nhóm màn hình chưa đăng nhập (login, register…). Không header. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
