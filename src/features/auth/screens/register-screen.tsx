import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useSendRegisterOtp } from '@/features/auth/api';
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
    <Screen
      onBack={() => router.back()}
      footer={
        <Button
          title="Tiếp tục"
          onPress={onSubmit}
          loading={sendOtp.isPending}
          disabled={!fullName || !email || !password || sendOtp.isPending}
        />
      }>
      <View style={styles.head}>
        <Text variant="title">Tạo tài khoản</Text>
        <Text variant="bodyMuted" style={styles.sub}>
          Vài thông tin nữa là xong. Tụi mình gửi mã xác thực về email của bạn.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Họ và tên"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A"
          error={errors.name}
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@truong.edu.vn"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
        />
        <TextField
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Tối thiểu 6 ký tự"
          secure
          autoCapitalize="none"
          error={errors.password}
        />

        {sendOtp.isError ? (
          <Text variant="caption" style={styles.error}>
            Chưa gửi được mã. Kiểm tra lại email hoặc thử lại sau.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 8, marginBottom: 24 },
  sub: { marginTop: 8 },
  form: { gap: 16 },
  error: { color: '#B32322' },
});
