import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Palette } from '@/components/ui/theme';

/**
 * Link sai (zoldify://... không khớp route nào). Không có file này thì Expo
 * Router hiện màn "Unmatched Route" tiếng Anh kèm link Sitemap liệt kê route.
 * dismissTo: về lại Trang chủ đang có trong stack, không có thì thay màn này.
 */
export default function NotFoundScreen() {
  return (
    <View style={styles.root}>
      <EmptyState
        icon="compass"
        title="Không tìm thấy trang này"
        subtitle="Link có thể đã cũ hoặc bị gõ sai."
        actionLabel="Về trang chủ"
        onAction={() => router.dismissTo('/')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
});
