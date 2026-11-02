import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';

/**
 * Màn tab tạm: khách -> mời đăng nhập; đã đăng nhập -> báo đang xây dựng.
 * Dùng cho các tab chưa dựng (giỏ, đăng bán, thông báo).
 *
 * `onBack`: màn đẩy chồng (không phải tab, VD Ví) phải có nút quay lại; thiếu
 * thì khách chỉ thoát được bằng phím Back hệ thống, iOS thì kẹt (D-02).
 */
export function TabPlaceholder({ title, note, onBack }: { title: string; note?: string; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';

  return (
    <View style={styles.root}>
      <View style={[styles.header, onBack && styles.headerRow, { paddingTop: insets.top + 10 }]}>
        {onBack ? <BackChevron onPress={onBack} /> : null}
        <Text variant="title" style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.center}>
        {guest ? (
          <>
            <Text variant="heading" style={styles.line}>Đăng nhập để tiếp tục</Text>
            <Text variant="bodyMuted" style={styles.line}>
              {note ?? `Cần đăng nhập để dùng ${title.toLowerCase()}.`}
            </Text>
            <View style={styles.cta}>
              <Button title="Đăng nhập" onPress={() => router.push('/login')} />
            </View>
          </>
        ) : (
          <Text variant="bodyMuted">Tính năng đang được xây dựng.</Text>
        )}
      </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  headerTitle: {},
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 16 },
});
