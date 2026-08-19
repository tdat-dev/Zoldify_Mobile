import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';
import { useAuthStore } from '@/features/auth/store';

/**
 * Trang chủ ecommerce: mở app là thấy sản phẩm luôn (khách chưa đăng nhập
 * vẫn duyệt được). Nút "Đăng nhập" ở góc chỉ dành cho khi cần.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, error, refetch, isRefetching } = useProducts(1, 20);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.brandRow}>
        <BrandMark size={30} />
        <Text style={styles.wordmark}>Zoldify</Text>
      </View>

      {status === 'signedIn' && user ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.full_name?.trim()?.[0]?.toUpperCase() ?? 'Z'}
          </Text>
        </View>
      ) : (
        <Pressable style={styles.loginBtn} onPress={() => router.push('/welcome')}>
          <Text style={styles.loginText}>Đăng nhập</Text>
        </Pressable>
      )}
    </View>
  );

  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.fill}>
          <ActivityIndicator size="large" color={Palette.brand} />
          <Text variant="bodyMuted" style={styles.hint}>
            Đang tải sản phẩm…
          </Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.fill}>
          <Text variant="heading">Không tải được sản phẩm</Text>
          <Text variant="bodyMuted" style={styles.hint}>
            {error instanceof Error ? error.message : 'Vui lòng thử lại.'}
          </Text>
          <View style={styles.retry}>
            <Button title="Thử lại" onPress={() => refetch()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <FlatList
        data={data.result}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <Text variant="heading" style={styles.sectionTitle}>
            Mới đăng
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyMuted">Chưa có sản phẩm nào.</Text>
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 20, color: Palette.ink, letterSpacing: -0.5 },
  loginBtn: {
    borderWidth: 1,
    borderColor: Palette.brand,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loginText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: Palette.brand },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 16, color: Palette.white },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  hint: { textAlign: 'center' },
  retry: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { padding: 16, gap: 14 },
  column: { gap: 14 },
  sectionTitle: { marginBottom: 4 },
  empty: { paddingVertical: 48, alignItems: 'center' },
});
