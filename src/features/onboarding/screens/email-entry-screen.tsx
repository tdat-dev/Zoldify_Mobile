import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useOnboardingStore } from '@/features/onboarding/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cửa vào hợp nhất kiểu Amazon: một ô email. Ta chưa có API tra "email đã
 * tồn tại chưa", nên bước sau để người dùng tự chọn đăng nhập hay tạo mới.
 */
export default function EmailEntryScreen() {
  const emailInStore = useOnboardingStore((s) => s.email);
  const setDraft = useOnboardingStore((s) => s.setDraft);
  const [email, setEmail] = useState(emailInStore);
  const [error, setError] = useState('');

  const onContinue = () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError('Email chưa đúng, kiểm tra lại nhé.');
      return;
    }
    setError('');
    setDraft({ email: value });
    router.push('/branch');
  };

  return (
    <Screen
      onBack={() => router.back()}
      footer={<Button title="Tiếp tục" onPress={onContinue} disabled={!email.trim()} />}>
      <View style={styles.head}>
        <Text variant="title">Đăng nhập hoặc tạo tài khoản</Text>
        <Text variant="bodyMuted" style={styles.sub}>
          Nhập email của bạn để tiếp tục.
        </Text>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="ban@truong.edu.vn"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        error={error}
        returnKeyType="next"
        onSubmitEditing={onContinue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 8, marginBottom: 28 },
  sub: { marginTop: 8 },
});
