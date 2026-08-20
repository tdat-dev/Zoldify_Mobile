import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Font, Palette } from '@/components/ui/theme';

/**
 * Thanh dưới: Trang chủ · Tìm kiếm · ĐĂNG BÁN · Thông báo · Tôi.
 * Giỏ hàng & Tin nhắn nằm trên header, không lặp ở đây.
 *
 * Nút "Đăng bán" = vòng tròn ĐẶC màu brand ở đúng ô icon (KHÔNG nổi/absolute).
 * Bản nổi absolute từng đè chữ / bị cắt trên react-native-web ở Safari iOS
 * (safe-area). Vòng tròn đặc, trong luồng, chiều cao theo safe-area → không
 * bao giờ đè hay cắt trên mọi nền. Trên app native có thể cho nổi lại sau.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.brand,
        tabBarInactiveTintColor: Palette.inkMuted,
        // KHÔNG ép height/padding — để react-navigation tự tính theo icon+nhãn
        // và tự cộng safe-area; ép cứng là cắt nhãn (đã trải nghiệm nhiều lần).
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: Palette.white,
          borderTopWidth: 1,
          borderTopColor: Palette.line,
        },
        tabBarLabelStyle: { fontFamily: Font.semibold, fontSize: 11 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Đăng bán',
          tabBarIcon: () => (
            <View style={styles.sellDot}>
              <Feather name="plus" size={22} color={Palette.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => <Feather name="bell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tôi',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Vòng tròn đặc, kích thước ~icon thường (không làm cao hàng, không tràn).
  sellDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
