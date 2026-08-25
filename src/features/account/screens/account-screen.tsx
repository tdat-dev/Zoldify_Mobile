import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';

/** Một dòng lối tắt trong Tài khoản — icon + nhãn + chevron, phẳng hairline. */
function MenuRow({
  icon,
  label,
  onPress,
  first,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  first?: boolean;
}) {
  return (
    <Pressable style={[styles.row, first && styles.rowFirst]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={Palette.inkMuted} />
      <Text variant="body" style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Palette.inkFaint} />
    </Pressable>
  );
}

/** Tab Tài khoản: khách -> mời đăng nhập; đã đăng nhập -> tên + đăng xuất. */
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  // Người bán mới có khu quản lý shop; buyer chỉ được mời "bắt đầu bán hàng".
  const isSeller = user ? ['seller', 'admin', 'moderator'].includes(user.role) : false;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text variant="title">Tôi</Text>
      </View>

      {status === 'signedIn' && user ? (
        <View style={styles.body}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.full_name?.trim()?.[0]?.toUpperCase() ?? 'Z'}
              </Text>
            </View>
            <View style={styles.who}>
              <Text variant="subheading">{user.full_name}</Text>
              <Text variant="caption">{user.email}</Text>
            </View>
          </View>

          <View style={styles.menu}>
            <MenuRow icon="receipt-outline" label="Đơn mua" first onPress={() => router.push('/orders')} />
            <MenuRow icon="heart-outline" label="Đã lưu" onPress={() => router.push('/saved' as Href)} />
            {/* Buyer chưa bán: mời bắt đầu bán (cùng dẫn tới cài đặt shop lần đầu). */}
            {!isSeller ? (
              <MenuRow icon="pricetags-outline" label="Bắt đầu bán hàng" onPress={() => router.push('/shop/settings')} />
            ) : null}
          </View>

          {/* Người bán mới có khu quản lý shop riêng (sau: Đơn bán, Ví/Doanh thu). */}
          {isSeller ? (
            <View>
              <Text variant="label" style={styles.sectionLabel}>Người bán</Text>
              <View style={styles.menu}>
                <MenuRow icon="storefront-outline" label="Cài đặt shop" first onPress={() => router.push('/shop/settings')} />
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button title="Đăng xuất" variant="ghost" onPress={() => signOut()} />
          </View>
        </View>
      ) : (
        <View style={styles.center}>
          <Text variant="heading" style={styles.line}>Chào bạn ở Zoldify</Text>
          <Text variant="bodyMuted" style={styles.line}>
            Đăng nhập để mua bán, theo dõi đơn và nhắn với người bán.
          </Text>
          <View style={styles.cta}>
            <Button title="Đăng nhập" onPress={() => router.push('/login')} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  body: { padding: 16, gap: 20 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 4,
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 20, color: Palette.white },
  who: { gap: 2 },
  menu: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  rowFirst: { borderTopWidth: 0 },
  rowLabel: { flex: 1 },
  sectionLabel: { marginBottom: 8, marginLeft: 4, color: Palette.inkMuted },
  actions: { gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 16 },
});
