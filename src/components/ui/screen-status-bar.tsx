import { useIsFocused } from 'expo-router';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';

/**
 * Màu chữ/icon thanh trạng thái cho MỘT màn, chỉ áp khi màn đang hiện.
 *
 * StatusBar xếp chồng theo thứ tự mount: cái mount sau thắng. Màn bị đè trong
 * stack vẫn còn mount, nên trước đây chi tiết sản phẩm (header xanh, icon
 * trắng) đè luôn lên màn Đánh giá header trắng: icon trắng trên nền trắng, mất
 * giờ và pin. Chỉ dựng khi focus thì rời màn là trả về mặc định "dark" ở root.
 */
export function ScreenStatusBar({ style }: { style: StatusBarStyle }) {
  const focused = useIsFocused();
  return focused ? <StatusBar style={style} /> : null;
}
