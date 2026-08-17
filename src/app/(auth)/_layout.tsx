import { Stack } from 'expo-router';

/** Màn đầu của vùng chưa đăng nhập là welcome. */
export const unstable_settings = {
  initialRouteName: 'welcome',
};

/** Nhóm màn chưa đăng nhập (welcome, login, register, otp…). Không header. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
