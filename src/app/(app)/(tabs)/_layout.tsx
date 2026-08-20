import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Palette } from '@/components/ui/theme';

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
 * Trang chủ · Tìm kiếm · ĐĂNG BÁN (tròn đặc) · Thông báo · Tôi.
 */
function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

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
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

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
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ color }) => <Feather name="search" size={24} color={color} />,
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
          tabBarIcon: ({ color }) => <Feather name="bell" size={24} color={color} />,
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
  label: {
    fontFamily: Font.semibold,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  sellDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
