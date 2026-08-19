import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette } from '@/components/ui/theme';

/**
 * Thanh dưới: Trang chủ · Tìm kiếm · ĐĂNG BÁN (nút tròn nổi giữa) · Thông báo
 * · Tài khoản. Giỏ hàng & Tin nhắn nằm trên header, không lặp ở đây. Icon
 * Feather (≈ lucide của web), nền trắng, hairline trên.
 */
function SellButton(props: { onPress?: (e: GestureResponderEvent) => void; accessibilityState?: { selected?: boolean } }) {
  return (
    <Pressable style={styles.sellWrap} onPress={props.onPress} accessibilityRole="button">
      <View style={styles.sellCircle}>
        <Feather name="plus" size={26} color={Palette.white} />
      </View>
      <Text style={styles.sellLabel}>Đăng bán</Text>
    </Pressable>
  );
}

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
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
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
          tabBarButton: (props) => (
            <SellButton onPress={props.onPress ?? undefined} accessibilityState={props.accessibilityState} />
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
  sellWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  sellCircle: {
    position: 'absolute',
    top: -18,
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.white,
    shadowColor: '#141E3C',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  sellLabel: { fontFamily: Font.semibold, fontSize: 11, color: Palette.brand },
});
