import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
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
import { usePushNotifications } from '@/features/notifications/push';
import { useWishlistStore } from '@/features/wishlist/store';
import { useReviewStore } from '@/features/reviews/store';
import { setOnSessionExpired } from '@/lib/api/client';
import { queryClient } from '@/lib/api/query-client';

// Giữ splash gốc trên màn hình cho tới khi ta chủ động ẩn. Gọi ở scope
// module (chạy lúc import), không đặt trong component.
SplashScreen.preventAutoHideAsync();

/** Mở app vào vùng duyệt sản phẩm, không phải màn đăng nhập. */
export const unstable_settings = {
  initialRouteName: '(app)',
};

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
 * Mô hình ecommerce: mở app là vào thẳng vùng duyệt (app) — khách chưa
 * đăng nhập vẫn xem/tìm sản phẩm được (backend để /products @Public). Nhóm
 * (auth) chỉ được đẩy lên khi khách chủ động đăng nhập hoặc chạm một hành
 * động cần tài khoản (mua/bán/giỏ/chat). Không còn Stack.Protected chặn.
 */
function RootNavigator({ appReady }: { appReady: boolean }) {
  const status = useAuthStore((s) => s.status);
  const hydrated = status !== 'hydrating' && appReady;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
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
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const hydrateReviews = useReviewStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  // Push (FCM): đăng ký token khi đăng nhập + điều hướng khi bấm thông báo.
  usePushNotifications();

  useEffect(() => {
    // Đọc token lúc mở app, xác định phiên.
    hydrate();
    // Đọc danh sách đã lưu (wishlist) cục bộ để tim hiện đúng ngay từ đầu.
    hydrateWishlist();
    // Đọc đánh giá người dùng đã gửi (lưu cục bộ) để hiện lại sau khi mở app.
    hydrateReviews();

    // Tầng mạng không tự điều hướng; 401 -> xoá phiên, cổng đăng nhập tự
    // đẩy về (auth). client.ts không cần biết gì về router.
    setOnSessionExpired(() => {
      queryClient.clear();
      sessionExpired();
    });
  }, [hydrate, hydrateWishlist, sessionExpired]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator appReady={fontsLoaded} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
