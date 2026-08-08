import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { setOnSessionExpired } from '@/lib/http';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Tầng mạng không tự điều hướng; nó chỉ báo ra, chỗ này quyết định
    // đi đâu. Nhờ vậy http.ts không phải biết gì về router.
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
