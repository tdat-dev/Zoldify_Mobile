import { Stack } from 'expo-router';

/**
 * Neo nhóm (auth) tại 'login': chạm hành động cần đăng nhập thì đẩy thẳng
 * /login, back từ đó thoát về (app). Carousel 'welcome' vẫn tồn tại nhưng
 * không còn là cửa vào mặc định.
 */
export const unstable_settings = {
  initialRouteName: 'login',
};

/** Nhóm màn chưa đăng nhập (welcome, login, register, otp…). Không header. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
