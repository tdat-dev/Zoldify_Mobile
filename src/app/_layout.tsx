import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  ErrorBoundaryProps,
  Stack,
  ThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthStore } from '@/features/auth/store';
import { setOnSessionExpired } from '@/lib/api/client';
import { queryClient } from '@/lib/api/query-client';

// Giữ splash gốc trên màn hình cho tới khi ta chủ động ẩn. Gọi ở scope
// module (chạy lúc import), không đặt trong component.
SplashScreen.preventAutoHideAsync();

/**
 * Lưới an toàn cuối cùng: render lỗi thay vì app trắng/crash. Expo Router
 * tự bắt lỗi render trong cây con và hiện component này. Các luồng nhạy
 * cảm (checkout, payment, chat) nên có ErrorBoundary riêng của chúng.
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

/**
 * Cổng đăng nhập khai báo. Không tự `router.replace`: lật `guard` là Expo
 * Router tự điều hướng về nhóm hợp lệ và dọn lịch sử. Đây là bảo vệ phía
 * client cho UX — server vẫn phải tự chặn mọi request.
 */
function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const signedIn = status === 'signedIn';
  const hydrated = status !== 'hydrating';

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>

      {/*
        Chỉ dựng overlay khi ĐÃ hydrate xong. Trong lúc đọc token, native
        splash (preventAutoHideAsync) che toàn màn — nhóm route bên dưới có
        thể là (auth) nhưng người dùng không thấy. Hydrate xong mới mount
        overlay: nó ẩn native splash rồi chạy reveal, để lộ đúng nhóm màn
        hình. Nhờ vậy KHÔNG nháy màn login trước khi biết đã đăng nhập chưa.
      */}
      {hydrated && <AnimatedSplashOverlay />}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);

  useEffect(() => {
    // Đọc token lúc mở app, xác định phiên.
    hydrate();

    // Tầng mạng không tự điều hướng; 401 -> xoá phiên, cổng đăng nhập tự
    // đẩy về (auth). client.ts không cần biết gì về router.
    setOnSessionExpired(() => {
      queryClient.clear();
      sessionExpired();
    });
  }, [hydrate, sessionExpired]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
