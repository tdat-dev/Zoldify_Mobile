import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette } from '@/components/ui/theme';

/**
 * Thanh dưới: Trang chủ · Tìm kiếm · ĐĂNG BÁN (icon tròn nổi giữa) · Thông báo
 * · Tôi. Giỏ hàng & Tin nhắn nằm trên header, không lặp ở đây.
 *
 * Nút giữa: vòng tròn 46px NỔI bằng absolute trong một slot 26px (bằng icon
 * thường), nên KHÔNG làm cao hàng → nhãn các tab không bị cắt (lỗi trên web).
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
            <View style={styles.sellSlot}>
              <View style={styles.sellCircle}>
                <Feather name="plus" size={26} color={Palette.white} />
              </View>
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
  // Slot bằng icon thường (26px) → hàng không bị cao lên → nhãn không bị cắt.
  sellSlot: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  // Vòng tròn nổi: absolute, đáy neo trong slot, cao 46 nên nhô lên khỏi thanh.
  sellCircle: {
    position: 'absolute',
    bottom: -2,
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.white,
    boxShadow: '0px 3px 8px rgba(20,30,60,0.20)',
  },
  sellLabel: { fontFamily: Font.semibold, fontSize: 11, color: Palette.brand, marginTop: 2 },
});
