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
type Field = 'name' | 'email' | 'password' | 'confirm';

export default function RegisterScreen() {
  const { email: draftEmail, setDraft } = useOnboardingStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(draftEmail);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const sendOtp = useSendRegisterOtp();

  const nameTrim = fullName.trim();
  const emailTrim = email.trim();
  const nameValid = nameTrim.length >= 2;
  const emailValid = EMAIL_RE.test(emailTrim);
  const passValid = password.length >= 6;
  const confirmValid = confirm.length > 0 && confirm === password;

  const touch = (k: Field) => setTouched((t) => ({ ...t, [k]: true }));

  // Chỉ báo lỗi sau khi rời ô (touched) và có nhập — không mắng lúc gõ dở.
  const nameError = touched.name && !nameValid ? 'Nhập tên của bạn (từ 2 ký tự).' : undefined;
  const emailError = touched.email && emailTrim.length > 0 && !emailValid ? 'Email chưa đúng định dạng.' : undefined;
  const passError = touched.password && password.length > 0 && !passValid ? 'Mật khẩu tối thiểu 6 ký tự.' : undefined;
  const confirmError =
    touched.confirm && confirm.length > 0 && confirm !== password ? 'Mật khẩu nhập lại chưa khớp.' : undefined;

  const canSubmit = nameValid && emailValid && passValid && confirmValid;

  const onSubmit = () => {
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!canSubmit || sendOtp.isPending) return;
    const value = { fullName: nameTrim, email: emailTrim, password };
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
          onBlur={() => touch('name')}
          error={nameError}
          valid={nameValid}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          textContentType="name"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          onBlur={() => touch('email')}
          error={emailError}
          valid={emailValid}
          placeholder="ban@truong.edu.vn"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={passwordRef}
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          onBlur={() => touch('password')}
          error={passError}
          valid={passValid}
          placeholder="Tạo mật khẩu"
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
          hint={passValid ? undefined : 'Tối thiểu 6 ký tự'}
        />
        <TextField
          ref={confirmRef}
          label="Nhập lại mật khẩu"
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => touch('confirm')}
          error={confirmError}
          valid={confirmValid}
          placeholder="Gõ lại mật khẩu"
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        {sendOtp.isError ? (
          <View style={styles.banner}>
            <Text variant="caption" style={styles.error}>
              Chưa gửi được mã. Kiểm tra lại email hoặc thử lại sau.
            </Text>
          </View>
        ) : null}
      </View>

      <Button
        title="Tiếp tục"
        onPress={onSubmit}
        loading={sendOtp.isPending}
        disabled={!canSubmit || sendOtp.isPending}
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
  banner: {
    backgroundColor: Palette.dangerBg,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
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
