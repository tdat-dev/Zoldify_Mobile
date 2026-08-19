import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useLogin } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { useOnboardingStore } from '@/features/onboarding/store';

/** Đăng nhập bằng email + mật khẩu (thật). Email điền sẵn nếu tới từ luồng. */
export default function LoginScreen() {
  const draftEmail = useOnboardingStore((s) => s.email);
  const [email, setEmail] = useState(draftEmail);
  const [password, setPassword] = useState('');

  const login = useLogin();
  const signIn = useAuthStore((s) => s.signIn);

  const disabled = !email.trim() || !password || login.isPending;

  const onSubmit = () => {
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          signIn();
          router.replace('/'); // đóng luồng auth, về feed sản phẩm
        },
      },
    );
  };

  return (
    <Screen
      onBack={() => router.back()}
      footer={
        <Button title="Đăng nhập" onPress={onSubmit} loading={login.isPending} disabled={disabled} />
      }>
      <View style={styles.head}>
        <Text variant="title">Đăng nhập</Text>
        <Text variant="bodyMuted" style={styles.sub}>
          Chào mừng bạn quay lại Zoldify.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@truong.edu.vn"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu"
          secure
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={() => !disabled && onSubmit()}
        />

        {login.isError ? (
          <Text variant="caption" style={styles.error}>
            Đăng nhập chưa được. Kiểm tra lại email và mật khẩu nhé.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 8, marginBottom: 28 },
  sub: { marginTop: 8 },
  form: { gap: 18 },
  error: { color: '#DC2626' },
});
