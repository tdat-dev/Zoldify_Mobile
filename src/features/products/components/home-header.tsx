import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';

/**
 * Header trang chủ — MỘT TẦNG, nền sáng, đúng bản web mới
 * (components/Header.tsx): bỏ chrome tối kiểu Amazon. Hàng trên là logo +
 * cụm tiện ích (Đăng bán đặc, chuông, tài khoản, GIỎ HÀNG đưa lên trên cùng
 * kèm badge). Hàng dưới là ô tìm kiếm có "Mọi giá" nằm bên trong.
 */
type FeatherName = React.ComponentProps<typeof Feather>['name'];

function IconButton({
  name,
  onPress,
  badge,
  size = 22,
}: {
  name: FeatherName;
  onPress: () => void;
  badge?: number;
  size?: number;
}) {
  return (
    <Pressable style={styles.iconBtn} onPress={onPress} hitSlop={4}>
      <Feather name={name} size={size} color={Palette.ink} />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function HomeHeader({ cartCount = 0 }: { cartCount?: number }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <Text style={styles.wordmark}>Zoldify</Text>

        <View style={styles.actions}>
          {/* Đăng bán = nút đặc, ngang hàng tiện ích — nửa còn lại của sàn C2C. */}
          <Pressable style={styles.sellBtn} onPress={() => router.push('/sell')} hitSlop={4}>
            <Feather name="plus" size={20} color={Palette.white} />
          </Pressable>
          <IconButton name="bell" onPress={() => router.push('/notifications')} />
          <IconButton name="user" onPress={() => router.push('/account')} />
          <IconButton
            name="shopping-cart"
            onPress={() => router.push('/cart')}
            badge={cartCount}
          />
        </View>
      </View>

      {/* Ô tìm kiếm: "Mọi giá" nằm trong hộp bên trái, kính lúp bên phải. */}
      <Pressable style={styles.search} onPress={() => router.push('/search')}>
        <View style={styles.scope}>
          <Text style={styles.scopeText}>Mọi giá</Text>
          <Feather name="chevron-down" size={14} color={Palette.inkFaint} />
        </View>
        <Text style={styles.placeholder} numberOfLines={1}>
          Tìm đồ cũ: máy tính, xe đạp, đồ gia dụng…
        </Text>
        <Feather name="search" size={18} color={Palette.inkMuted} style={styles.searchIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Palette.surfaceCard,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordmark: {
    fontFamily: Font.extrabold,
    fontSize: 22,
    color: Palette.brand,
    letterSpacing: -0.5,
    paddingLeft: 4,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sellBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.control,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: Palette.price,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: Font.bold, fontSize: 10, color: Palette.white },
  search: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 44,
    borderRadius: Radius.control,
    backgroundColor: Palette.surfaceSunken,
    overflow: 'hidden',
  },
  scope: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: Palette.lineStrong,
  },
  scopeText: { fontFamily: Font.medium, fontSize: 13, color: Palette.inkMuted },
  placeholder: {
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 12,
    fontFamily: Font.regular,
    fontSize: 13.5,
    color: Palette.inkFaint,
  },
  searchIcon: { alignSelf: 'center', marginRight: 10 },
});
