import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useCartCount } from '@/features/cart/api';
import { useChatUnreadTotal } from '@/features/chat/api';
import { useAuthStore } from '@/features/auth/store';
import { PRICE_SCOPES, type PriceScope } from '@/features/products/price-scopes';

/**
 * Header trang chủ — gọn: MỘT hàng gồm ô tìm kiếm (có "Mọi giá" lọc thật) +
 * Tin nhắn + Giỏ hàng (badge thật). Bỏ logo, nút Đăng bán, chuông, tài khoản
 * — những việc đó đã có ở thanh dưới, không cần lặp trên đầu.
 */
type FeatherName = React.ComponentProps<typeof Feather>['name'];

function IconButton({
  name,
  onPress,
  badge,
  size = 23,
}: {
  name: FeatherName;
  onPress: () => void;
  badge?: number;
  size?: number;
}) {
  return (
    <Pressable style={styles.iconBtn} onPress={onPress} hitSlop={4}>
      <Feather name={name} size={size} color={Palette.white} />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : String(badge)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const { data: cartCount = 0 } = useCartCount();
  const { data: chatUnread = 0 } = useChatUnreadTotal(!guest);
  const [scopeOpen, setScopeOpen] = useState(false);

  const openSearch = (scope?: PriceScope) => {
    setScopeOpen(false);
    const params: Record<string, string> = {};
    if (scope?.price_min != null) params.price_min = String(scope.price_min);
    if (scope?.price_max != null) params.price_max = String(scope.price_max);
    router.push({ pathname: '/search', params });
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {/* Ô tìm kiếm: "Mọi giá" mở dropdown lọc thật, phần còn lại mở tìm kiếm. */}
        <View style={styles.search}>
          <Pressable style={styles.scope} onPress={() => setScopeOpen(true)} hitSlop={6}>
            <Text style={styles.scopeText}>Mọi giá</Text>
            <Feather name="chevron-down" size={14} color={Palette.inkFaint} />
          </Pressable>
          <Pressable style={styles.searchTap} onPress={() => openSearch()}>
            <Text style={styles.placeholder} numberOfLines={1}>
              Tìm đồ cũ & mới: máy tính, xe đạp…
            </Text>
            <Feather name="search" size={18} color={Palette.inkMuted} style={styles.searchIcon} />
          </Pressable>
        </View>

        <IconButton name="message-circle" onPress={() => router.push('/messages')} badge={chatUnread} />
        <IconButton name="shopping-cart" onPress={() => router.push('/cart')} badge={cartCount} />
      </View>

      {/* Dropdown tầm tiền — sheet dưới đáy, phẳng đúng doctrine sổ kê. */}
      <Modal
        visible={scopeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setScopeOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setScopeOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <Text variant="label" style={styles.sheetTitle}>Duyệt theo tầm tiền</Text>
            {PRICE_SCOPES.map((s) => (
              <Pressable key={s.key} style={styles.scopeRow} onPress={() => openSearch(s)}>
                <Text style={styles.scopeRowText}>{s.label}</Text>
                <Feather name="chevron-right" size={16} color={Palette.inkFaint} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Palette.brand,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 3,
    top: 2,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 44,
    borderRadius: Radius.control,
    backgroundColor: Palette.white,
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
  searchTap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  placeholder: {
    flex: 1,
    paddingHorizontal: 12,
    fontFamily: Font.regular,
    fontSize: 13.5,
    color: Palette.inkFaint,
  },
  searchIcon: { marginRight: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,30,60,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Palette.surfaceCard,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  sheetTitle: { paddingHorizontal: 12, marginBottom: 4, color: Palette.inkMuted },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  scopeRowText: { fontFamily: Font.medium, fontSize: 15, color: Palette.ink },
});
