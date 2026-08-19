import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';

/** Tab Tài khoản: khách -> mời đăng nhập; đã đăng nhập -> tên + đăng xuất. */
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

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

          <View style={styles.actions}>
            <Button
              title="Cài đặt shop"
              variant="secondary"
              onPress={() => router.push('/shop/settings')}
            />
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
            <Button title="Đăng nhập / Tạo tài khoản" onPress={() => router.push('/welcome')} />
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
  actions: { gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 16 },
});
