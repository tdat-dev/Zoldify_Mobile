import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
} from 'react-native';

import { useLogin } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

/**
 * Màn hình đăng nhập mẫu.
 *
 * Cố tình để trần, không thư viện form — đủ để chứng minh đường đi
 * đăng nhập chạy thật và token được cất vào SecureStore. Làm lại bằng
 * react-hook-form + zod khi dựng giao diện thật.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useLogin();
  const signIn = useAuthStore((s) => s.signIn);

  const disabled = !email || !password || login.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-white px-6">
      <Text className="mb-1 text-2xl font-bold text-slate-900">Đăng nhập</Text>
      <Text className="mb-6 text-slate-500">Zoldify — đồ cũ, vẫn chất</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-3 rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mật khẩu"
        secureTextEntry
        className="mb-4 rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
      />

      {login.isError && (
        <Text className="mb-3 text-sm text-red-600">
          Đăng nhập không thành công. Kiểm tra lại email và mật khẩu.
        </Text>
      )}

      <Pressable
        disabled={disabled}
        onPress={() =>
          login.mutate({ email, password }, { onSuccess: () => signIn() })
        }
        className={`items-center rounded-lg py-4 ${disabled ? 'bg-slate-300' : 'bg-brand'}`}>
        {login.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-semibold text-white">Đăng nhập</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}
