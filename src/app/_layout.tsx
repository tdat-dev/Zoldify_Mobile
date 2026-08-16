import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  ErrorBoundaryProps,
  ThemeProvider,
  router,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { setOnSessionExpired } from '@/lib/api/client';
import { queryClient } from '@/lib/api/query-client';

SplashScreen.preventAutoHideAsync();

/**
 * Lưới an toàn cuối cùng: một màn hình render lỗi thay vì app trắng/crash.
 * Expo Router tự bắt lỗi render trong cây con và hiện component này.
 * Các luồng nhạy cảm (checkout, payment, chat) nên có ErrorBoundary riêng.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white px-6">
      <Text className="text-center text-lg font-bold text-slate-900">
        Có gì đó trục trặc
      </Text>
      <Text className="text-center text-sm text-slate-500">{error.message}</Text>
      <Pressable onPress={retry} className="mt-2 rounded-lg bg-brand px-5 py-3">
        <Text className="font-semibold text-white">Thử lại</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Tầng mạng không tự điều hướng; nó chỉ báo ra, chỗ này quyết định
    // đi đâu. Nhờ vậy client.ts không phải biết gì về router.
    setOnSessionExpired(() => {
      queryClient.clear();
      router.replace('/login');
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
