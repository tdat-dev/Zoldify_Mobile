import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette } from '@/components/ui/theme';

/**
 * Thanh dưới: Trang chủ · Tìm kiếm · ĐĂNG BÁN (icon tròn nổi giữa) · Thông báo
 * · Tôi. Giỏ hàng & Tin nhắn nằm trên header, không lặp ở đây.
 *
 * Nút giữa nổi bằng cách dịch RIÊNG icon lên (translateY) — không dùng
 * tabBarButton tuỳ biến, nhờ đó nhãn vẫn nằm đúng hàng như các tab khác và
 * không bị đè/cắt (lỗi thấy trên web trước đây).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.brand,
        tabBarInactiveTintColor: Palette.inkMuted,
        tabBarStyle: {
          backgroundColor: Palette.white,
          borderTopWidth: 1,
          borderTopColor: Palette.line,
          height: 66,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontFamily: Font.semibold, fontSize: 11 },
        tabBarItemStyle: { paddingTop: 2 },
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
            <View style={styles.sellCircle}>
              <Feather name="plus" size={26} color={Palette.white} />
            </View>
          ),
          tabBarLabel: () => <Text style={styles.sellLabel}>Đăng bán</Text>,
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
  // Dịch icon lên cho nổi khỏi thanh; nhãn "Đăng bán" vẫn ở đúng hàng nhãn.
  sellCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.white,
    transform: [{ translateY: -16 }],
    shadowColor: '#141E3C',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  sellLabel: { fontFamily: Font.semibold, fontSize: 11, color: Palette.brand },
});
