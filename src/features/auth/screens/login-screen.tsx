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
import { useLogin } from '@/features/auth/api';
import { googleAvailable } from '@/lib/firebase-config';
import { useAuthStore } from '@/features/auth/store';
import { useOnboardingStore } from '@/features/onboarding/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Đăng nhập bằng email + mật khẩu (thật). Email điền sẵn nếu tới từ luồng. */
export default function LoginScreen() {
  const draftEmail = useOnboardingStore((s) => s.email);
  const [email, setEmail] = useState(draftEmail);
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const login = useLogin();
  const signIn = useAuthStore((s) => s.signIn);

  const emailTrim = email.trim();
  const emailValid = EMAIL_RE.test(emailTrim);
  // Chỉ báo lỗi định dạng khi người dùng đã rời ô (đừng mắng lúc đang gõ dở).
  const emailError = emailTouched && emailTrim.length > 0 && !emailValid ? 'Email chưa đúng định dạng.' : undefined;

  const disabled = !emailValid || !password || login.isPending;

  // Xoá lỗi server cũ ngay khi người dùng sửa lại — để lỗi không dính lì.
  const clearServerError = () => {
    if (login.isError) login.reset();
  };

  const onSubmit = () => {
    setEmailTouched(true);
    if (!emailValid || !password || login.isPending) return;
    login.mutate(
      { email: emailTrim, password },
      {
        onSuccess: () => {
          signIn();
          router.replace('/'); // đóng luồng auth, về feed sản phẩm
        },
      },
    );
  };

  // Phân biệt "sai thông tin" (server trả lỗi) với "mất mạng" (không có response)
  // — người mất mạng mà bị mắng "sai mật khẩu" sẽ gõ lại vô ích. Lỗi sai thông
  // tin gắn ngay dưới ô mật khẩu; lỗi mạng để banner riêng.
  const hasResponse = !!(login.error as { response?: unknown })?.response;
  const credError = login.isError && hasResponse ? 'Email hoặc mật khẩu chưa đúng. Kiểm tra lại nhé.' : undefined;
  const networkError = login.isError && !hasResponse ? 'Mất kết nối. Kiểm tra mạng rồi thử lại nhé.' : null;

  return (
    <Screen scroll onBack={() => router.back()}>
      {/* Neo brand ở gần đỉnh (không center dọc) — vị trí cố định, không nhảy
          khi bàn phím bật/tắt. Khoảng thở nhẹ để logo rời header. */}
      <View style={styles.brandSpace} />
      <AuthIntro title="Đăng nhập" lead="Nhập email và mật khẩu để vào lại nhé." />

      {googleAvailable() ? (
        <>
          <GoogleButton label="Tiếp tục với Google" />
          <View style={styles.divider}>
            <OrDivider label="hoặc dùng email" />
          </View>
        </>
      ) : null}

      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            clearServerError();
          }}
          onBlur={() => setEmailTouched(true)}
          error={emailError}
          valid={emailValid}
          placeholder="ban@truong.edu.vn"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus={!draftEmail}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={passwordRef}
          label="Mật khẩu"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            clearServerError();
          }}
          error={credError}
          placeholder="Nhập mật khẩu"
          secure
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          autoFocus={!!draftEmail}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        <Pressable
          style={styles.forgotRow}
          hitSlop={10}
          onPress={() => router.push('/forgot-password')}>
          <Text variant="link">Quên mật khẩu?</Text>
        </Pressable>

        {networkError ? (
          <View style={styles.banner}>
            <Text variant="caption" style={styles.error}>
              {networkError}
            </Text>
          </View>
        ) : null}
      </View>

      <Button
        title="Đăng nhập"
        onPress={onSubmit}
        loading={login.isPending}
        disabled={disabled}
        style={styles.cta}
      />

      <Pressable
        style={styles.altRow}
        hitSlop={10}
        onPress={() => router.push('/register')}>
        <Text variant="bodyMuted">Chưa có tài khoản? </Text>
        <Text variant="link">Đăng ký</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandSpace: { height: 24 },
  divider: { marginVertical: 18 },
  form: { gap: 16 },
  forgotRow: { alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center' },
  error: { color: Palette.dangerFg },
  banner: {
    backgroundColor: Palette.dangerBg,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cta: { marginTop: 8 },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    marginTop: 16,
    marginBottom: 8,
  },
});
