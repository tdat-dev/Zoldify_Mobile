import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';
import { useAuthStore } from '@/features/auth/store';

/**
 * Trang chủ ecommerce: header chrome tối (thương hiệu + tìm kiếm + đăng
 * nhập) trên nền tối, feed sản phẩm trên nền xám nhạt — đúng ngôn ngữ web.
 * Khách chưa đăng nhập vẫn duyệt được.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, error, refetch, isRefetching } = useProducts(1, 20);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  const header = (
    <View style={[styles.chrome, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <Text style={styles.wordmark}>Zoldify</Text>
        {status === 'signedIn' && user ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.full_name?.trim()?.[0]?.toUpperCase() ?? 'Z'}
            </Text>
          </View>
        ) : (
          <Pressable hitSlop={8} onPress={() => router.push('/welcome')}>
            <Text style={styles.loginText}>Đăng nhập</Text>
          </Pressable>
        )}
      </View>

      {/* Ô tìm kiếm → mở màn tìm kiếm. */}
      <Pressable style={styles.search} onPress={() => router.push('/search')}>
        <View style={styles.magCircle} />
        <View style={styles.magHandle} />
        <Text style={styles.searchPlaceholder}>Tìm sản phẩm trên Zoldify</Text>
      </Pressable>
    </View>
  );

  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.fill}>
          <ActivityIndicator size="large" color={Palette.brand} />
          <Text variant="bodyMuted" style={styles.hint}>Đang tải sản phẩm…</Text>
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
          <Text variant="heading" style={styles.sectionTitle}>Mới đăng</Text>
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
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  chrome: { backgroundColor: Palette.chrome, paddingHorizontal: 16, paddingBottom: 12 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordmark: { fontFamily: Font.extrabold, fontSize: 20, color: Palette.white, letterSpacing: -0.4 },
  loginText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.white },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.lineOnDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 15, color: Palette.white },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: Radius.control,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    gap: 8,
  },
  magCircle: {
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Palette.inkFaint,
  },
  magHandle: {
    position: 'absolute',
    left: 22,
    top: 24,
    width: 6,
    height: 2,
    backgroundColor: Palette.inkFaint,
    transform: [{ rotate: '45deg' }],
  },
  searchPlaceholder: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.inkFaint },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  hint: { textAlign: 'center' },
  retry: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { padding: 12, gap: 18 },
  column: { gap: 12 },
  sectionTitle: { marginBottom: 2 },
  empty: { paddingVertical: 48, alignItems: 'center' },
});
