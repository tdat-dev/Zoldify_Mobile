import Feather from '@expo/vector-icons/Feather';
import { router, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';

/**
 * Tab chỉ dùng được khi đã đăng nhập. Khách chạm vào → bung THẲNG form
 * /login (không render màn "Đăng nhập để tiếp tục" bắt bấm nút nữa).
 * Trang chủ luôn công khai.
 */
const AUTH_TABS = new Set(['notifications', 'orders', 'sell', 'account']);

/** Chỉ lấy phần props của tabBar mình dùng (tránh phụ thuộc type trực tiếp). */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; tabBarLabel?: unknown; tabBarIcon?: (p: { focused: boolean; color: string; size: number }) => React.ReactNode } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

/**
 * Thanh dưới TỰ DỰNG (custom tabBar) — không dùng thanh mặc định của
 * react-navigation vì trên web nó cho "slot nhãn" ~10px, cắt chân/dấu chữ
 * tiếng Việt (đo được: nhãn h=10 cho fontSize 11). Tự render thì mình kiểm
 * soát hoàn toàn chiều cao icon + nhãn (lineHeight 15) → không bao giờ cắt.
 *
 * 5 ô: Trang chủ · Thông báo · ＋ĐĂNG BÁN (tròn to, nhô lên, CHÍNH GIỮA) ·
 * Đơn mua · Tôi. Nút bán nhô lên bằng marginTop ÂM trong luồng flex (KHÔNG
 * position:absolute) — nên vẫn chiếm chỗ ngang, không đè hàng xóm, không
 * xung khắc safe-area đáy.
 */
function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? Palette.brand : Palette.inkMuted;
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) return;
          // Khách chạm tab cần đăng nhập → vào thẳng form login, không đổi tab.
          if (guest && AUTH_TABS.has(route.name)) {
            router.push('/login');
            return;
          }
          if (!focused) navigation.navigate(route.name);
        };

        // Ô ĐĂNG BÁN: nút tròn to, nhô lên, nổi trội — điểm nhấn hành động chính.
        if (route.name === 'sell') {
          return (
            <Pressable
              key={route.key}
              style={styles.item}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel="Đăng bán">
              <View style={styles.sellRaise}>
                <View style={styles.sellDot}>
                  <Feather name="plus" size={28} color={Palette.white} />
                </View>
                <Text style={[styles.label, styles.sellLabel]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}>
            <View style={styles.icon}>
              {options.tabBarIcon?.({ focused, color, size: 24 })}
            </View>
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color }) => <Feather name="bell" size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="sell" options={{ title: 'Đăng bán' }} />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn mua',
          tabBarIcon: ({ color }) => <Feather name="package" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tôi',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  icon: { height: 26, alignItems: 'center', justifyContent: 'center' },
  // lineHeight 15 cho fontSize 11 → đủ chỗ dấu + chân chữ tiếng Việt.
  // alignSelf:stretch để nhãn LẤP đủ bề rộng ô (item alignItems:center không
  // stretch → Text numberOfLines=1 không có bề rộng xác định, Android đo mơ hồ
  // rồi cắt sớm thành "…"). Có bề rộng rõ + textAlign center → không cắt nữa.
  label: {
    alignSelf: 'stretch',
    fontFamily: Font.semibold,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  // Cụm nút bán: nhô lên bằng marginTop âm (vẫn trong luồng, chiếm chỗ ngang).
  sellRaise: { alignItems: 'center', gap: 4, marginTop: -22 },
  sellDot: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    // Vòng trắng để nút "tách" khỏi đường viền thanh, đọc như đang nổi lên.
    borderWidth: 4,
    borderColor: Palette.white,
    // Đổ bóng nhẹ cho cảm giác nổi (iOS + Android + web).
    shadowColor: Palette.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  sellLabel: { color: Palette.brand },
});
