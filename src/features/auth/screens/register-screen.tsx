import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Palette } from '@/components/ui/theme';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { AuthIntro } from '@/features/auth/components/auth-intro';
import { GoogleButton } from '@/features/auth/components/google-button';
import { OrDivider } from '@/features/auth/components/or-divider';
import { useSendRegisterOtp } from '@/features/auth/api';
import { googleAvailable } from '@/lib/firebase-config';
import { useOnboardingStore } from '@/features/onboarding/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Nhập thông tin tạo tài khoản. Bấm tiếp là gửi OTP về email (thật), rồi
 * sang màn nhập mã. Mật khẩu + tên giữ trong onboarding store để bước OTP
 * dùng lại (verify-otp cần cả email + mật khẩu).
 */
export default function RegisterScreen() {
  const { email: draftEmail, setDraft } = useOnboardingStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(draftEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const sendOtp = useSendRegisterOtp();

  const validate = () => {
    const next: typeof errors = {};
    if (fullName.trim().length < 2) next.name = 'Nhập tên của bạn.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Email chưa đúng.';
    if (password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = () => {
    if (!validate()) return;
    const value = { fullName: fullName.trim(), email: email.trim(), password };
    setDraft(value);
    sendOtp.mutate(
      { email: value.email, full_name: value.fullName },
      { onSuccess: () => router.push('/otp') },
    );
  };

  return (
    <Screen scroll onBack={() => router.back()}>
      {/* Neo brand gần đỉnh (không center dọc) — nhất quán với màn đăng nhập. */}
      <View style={styles.brandSpace} />
      <AuthIntro
        title="Tạo tài khoản"
        lead="Vài thông tin nữa là xong. Tụi mình gửi mã xác thực về email của bạn."
      />

      {googleAvailable() ? (
        <>
          <GoogleButton label="Đăng ký với Google" />
          <View style={styles.divider}>
            <OrDivider label="hoặc dùng email" />
          </View>
        </>
      ) : null}

      <View style={styles.form}>
        <TextField
          label="Họ và tên"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          textContentType="name"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
          error={errors.name}
        />
        <TextField
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@truong.edu.vn"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
          error={errors.email}
        />
        <TextField
          ref={passwordRef}
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Tạo mật khẩu"
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          hint="Tối thiểu 6 ký tự"
          error={errors.password}
        />

        {sendOtp.isError ? (
          <Text variant="caption" style={styles.error}>
            Chưa gửi được mã. Kiểm tra lại email hoặc thử lại sau.
          </Text>
        ) : null}
      </View>

      <Button
        title="Tiếp tục"
        onPress={onSubmit}
        loading={sendOtp.isPending}
        disabled={!fullName || !email || !password || sendOtp.isPending}
        style={styles.cta}
      />

      <Pressable
        style={styles.altRow}
        hitSlop={10}
        onPress={() => router.replace('/login')}>
        <Text variant="bodyMuted">Đã có tài khoản? </Text>
        <Text variant="link">Đăng nhập</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandSpace: { height: 24 },
  divider: { marginVertical: 18 },
  form: { gap: 16 },
  error: { color: Palette.dangerFg },
  cta: { marginTop: 24 },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    marginTop: 16,
    marginBottom: 8,
  },
});
