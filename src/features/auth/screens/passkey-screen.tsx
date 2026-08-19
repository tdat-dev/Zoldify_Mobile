import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useLogin } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { useOnboardingStore } from '@/features/onboarding/store';

/**
 * Sau khi tạo tài khoản: mời bật đăng nhập sinh trắc (passkey).
 *
 * MOCKUP: backend chưa có webauthn/passkey nên cả "Tạo passkey" và "Bỏ qua"
 * đều chỉ đăng nhập thật để vào app. Khi làm passkey thật: dùng
 * expo-local-authentication ở nút "Tạo passkey". Đăng nhập diễn ra Ở ĐÂY
 * (không phải màn OTP) để cổng auth không lật sớm làm mất màn này.
 */
export default function PasskeyScreen() {
  const { email, password, reset } = useOnboardingStore();
  const login = useLogin();
  const signIn = useAuthStore((s) => s.signIn);
  const [failed, setFailed] = useState(false);

  const finalize = () => {
    setFailed(false);
    login.mutate(
      { email, password },
      {
        onSuccess: async () => {
          await signIn();
          reset();
          router.replace('/'); // vào feed sản phẩm
        },
        onError: () => setFailed(true),
      },
    );
  };

  return (
    <Screen
      footer={
        <>
          <Button
            title="Tạo passkey"
            onPress={finalize}
            loading={login.isPending}
            disabled={login.isPending}
          />
          <Button
            title="Bỏ qua"
            variant="ghost"
            onPress={finalize}
            disabled={login.isPending}
          />
        </>
      }>
      <View style={styles.center}>
        <View style={styles.badgeRing}>
          <View style={styles.badgeCore}>
            <View style={styles.check} />
          </View>
        </View>

        <Text variant="title" style={styles.title}>
          Tài khoản đã sẵn sàng
        </Text>
        <Text variant="bodyMuted" style={styles.body}>
          Bật đăng nhập bằng Face ID hoặc vân tay để lần sau vào Zoldify nhanh như
          mở khoá điện thoại. Tụi mình không lưu khuôn mặt hay vân tay của bạn.
        </Text>

        {failed ? (
          <Text variant="caption" style={styles.error}>
            Chưa đăng nhập được. Thử lại, hoặc{' '}
            <Text variant="link" onPress={() => router.replace('/login')}>
              đăng nhập thủ công
            </Text>
            .
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  badgeRing: {
    width: 128,
    height: 128,
    borderRadius: 999,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  badgeCore: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 32,
    height: 18,
    borderLeftWidth: 5,
    borderBottomWidth: 5,
    borderColor: Palette.successFg,
    transform: [{ rotate: '-45deg' }],
    marginTop: -5,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },
  error: { color: '#B32322', textAlign: 'center', marginTop: 18 },
});
