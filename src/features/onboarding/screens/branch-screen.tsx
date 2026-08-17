import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useOnboardingStore } from '@/features/onboarding/store';

/**
 * Sau khi nhập email: cho người dùng tự chọn tạo mới hay đăng nhập (vì
 * backend chưa có API tra email). Email hiển thị kèm nút "Đổi".
 */
export default function BranchScreen() {
  const email = useOnboardingStore((s) => s.email);

  return (
    <Screen onBack={() => router.back()}>
      <View style={styles.head}>
        <Text variant="title">Tiếp tục với email này</Text>
        <View style={styles.emailRow}>
          <Text variant="body" style={styles.email} numberOfLines={1}>
            {email}
          </Text>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Text variant="link">Đổi</Text>
          </Pressable>
        </View>
      </View>

      <Button title="Tạo tài khoản mới" onPress={() => router.push('/register')} />

      <View style={styles.divider} />

      <Text variant="bodyMuted" style={styles.already}>
        Đã có tài khoản Zoldify?
      </Text>
      <Button title="Đăng nhập" variant="secondary" onPress={() => router.push('/login')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 8, marginBottom: 28 },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  email: { flex: 1, color: Palette.muted },
  divider: { height: 1, backgroundColor: Palette.line, marginVertical: 28 },
  already: { marginBottom: 12 },
});
