import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Palette } from '@/components/ui/theme';
import { AuthIntro } from '@/features/auth/components/auth-intro';
import { useResetPassword, useSendForgotPasswordOtp } from '@/features/auth/api';
import { useOnboardingStore } from '@/features/onboarding/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Quên mật khẩu (thật, backend đã có):
 *  Bước 1: nhập email → gửi OTP (/auth/forgot-password/send-otp).
 *  Bước 2: nhập mã + mật khẩu mới → đặt lại (/auth/forgot-password/reset) →
 *          về /login (điền sẵn email để đăng nhập ngay).
 */
export default function ForgotPasswordScreen() {
  const setDraft = useOnboardingStore((s) => s.setDraft);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const send = useSendForgotPasswordOtp();
  const reset = useResetPassword();

  const emailOk = EMAIL_RE.test(email.trim());

  const sendOtp = () => {
    if (!emailOk || send.isPending) return;
    send.mutate(email.trim(), { onSuccess: () => setStep(2) });
  };

  const doReset = () => {
    if (otp.length < 6 || newPassword.length < 6 || reset.isPending) return;
    reset.mutate(
      { email: email.trim(), otp, newPassword },
      {
        onSuccess: () => {
          setDraft({ email: email.trim() });
          router.replace('/login');
        },
      },
    );
  };

  if (step === 2) {
    return (
      <Screen scroll onBack={() => setStep(1)}>
        <View style={styles.brandSpace} />
        <AuthIntro
          title="Đặt lại mật khẩu"
          lead={`Nhập mã 6 số tụi mình gửi tới ${email} và mật khẩu mới của bạn.`}
        />

        <View style={styles.form}>
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          <TextField
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Tạo mật khẩu mới"
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={doReset}
            hint="Tối thiểu 6 ký tự"
          />

          {reset.isError ? (
            <Text variant="caption" style={styles.error}>
              Mã chưa đúng hoặc đã hết hạn. Thử lại nhé.
            </Text>
          ) : null}
        </View>

        <Button
          title="Đặt lại mật khẩu"
          onPress={doReset}
          loading={reset.isPending}
          disabled={otp.length < 6 || newPassword.length < 6 || reset.isPending}
          style={styles.cta}
        />

        <Pressable
          style={styles.resend}
          hitSlop={10}
          disabled={send.isPending}
          onPress={() => send.mutate(email.trim())}>
          <Text variant="bodyMuted">Chưa nhận được mã? </Text>
          <Text variant="link">{send.isPending ? 'Đang gửi…' : 'Gửi lại'}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen scroll onBack={() => router.back()}>
      <View style={styles.brandSpace} />
      <AuthIntro
        title="Quên mật khẩu"
        lead="Nhập email tài khoản, tụi mình gửi mã để bạn đặt lại mật khẩu."
      />

      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@truong.edu.vn"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus
          returnKeyType="go"
          onSubmitEditing={sendOtp}
        />

        {send.isError ? (
          <Text variant="caption" style={styles.error}>
            Chưa gửi được mã. Kiểm tra lại email hoặc thử lại sau.
          </Text>
        ) : null}
      </View>

      <Button
        title="Gửi mã xác thực"
        onPress={sendOtp}
        loading={send.isPending}
        disabled={!emailOk || send.isPending}
        style={styles.cta}
      />

      <Pressable
        style={styles.resend}
        hitSlop={10}
        onPress={() => router.replace('/login')}>
        <Text variant="bodyMuted">Nhớ ra rồi? </Text>
        <Text variant="link">Đăng nhập</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandSpace: { height: 24 },
  form: { gap: 18 },
  error: { color: Palette.dangerFg },
  cta: { marginTop: 24 },
  resend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    marginTop: 16,
    marginBottom: 8,
  },
});
