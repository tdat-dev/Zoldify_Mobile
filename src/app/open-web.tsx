import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Palette } from '@/components/ui/theme';
import { linkWebZoldify } from '@/lib/app-links';

/**
 * Link zoldify.com mà app chưa có màn riêng (danh mục, trang đích, trang của người
 * bán trên web). Android đã giao link cho app, gọi Linking.openURL thì Android lại
 * giao về app và quay vòng; nên mở bằng tab trình duyệt trong app, đóng tab thì về
 * Trang chủ.
 *
 * Nằm ngoài nhóm (app) vì không cần cổng đăng nhập: trang web tự lo phần đó.
 */
export default function OpenWebScreen() {
  const { url } = useLocalSearchParams<{ url?: string }>();

  useEffect(() => {
    const link = linkWebZoldify(typeof url === 'string' ? url : undefined);
    if (!link) {
      router.replace('/');
      return;
    }
    openBrowserAsync(link)
      .catch(() => undefined)
      .finally(() => router.replace('/'));
  }, [url]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={Palette.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.surfacePage },
});
