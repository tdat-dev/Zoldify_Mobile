import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OtpInput } from '@/components/ui/otp-input';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useSendRegisterOtp, useVerifyRegisterOtp } from '@/features/auth/api';
import { useOnboardingStore } from '@/features/onboarding/store';

/**
 * Nhập mã OTP gửi về email (thật). Xác thực xong tài khoản đã được tạo,
 * chuyển sang màn passkey — đăng nhập thật sự diễn ra ở đó để cổng auth
 * không lật sớm làm mất màn passkey.
 */
export default function OtpScreen() {
  const { email, fullName, password } = useOnboardingStore();
  const [otp, setOtp] = useState('');

  const verify = useVerifyRegisterOtp();
  const resend = useSendRegisterOtp();

  const onSubmit = () => {
    if (otp.length < 6) return;
    verify.mutate(
      { email, otp, password },
      { onSuccess: () => router.push('/passkey') },
    );
  };

  return (
    <Screen
      onBack={() => router.back()}
      footer={
        <Button
          title="Xác nhận"
          onPress={onSubmit}
          loading={verify.isPending}
          disabled={otp.length < 6 || verify.isPending}
        />
      }>
      <View style={styles.head}>
        <Text variant="title">Nhập mã xác thực</Text>
        <Text variant="bodyMuted" style={styles.sub}>
          Tụi mình vừa gửi mã 6 số tới{'\n'}
          <Text variant="body" style={styles.email}>
            {email}
          </Text>
        </Text>
      </View>

      <OtpInput value={otp} onChange={setOtp} autoFocus />

      {verify.isError ? (
        <Text variant="caption" style={styles.error}>
          Mã chưa đúng hoặc đã hết hạn. Thử lại nhé.
        </Text>
      ) : null}

      <Pressable
        style={styles.resend}
        hitSlop={8}
        disabled={resend.isPending}
        onPress={() => resend.mutate({ email, full_name: fullName })}>
        <Text variant="bodyMuted">Chưa nhận được mã? </Text>
        <Text variant="link">{resend.isPending ? 'Đang gửi…' : 'Gửi lại'}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 8, marginBottom: 28 },
  sub: { marginTop: 8 },
  email: { color: '#0F172A' },
  error: { color: '#B32322', marginTop: 14 },
  resend: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
});
