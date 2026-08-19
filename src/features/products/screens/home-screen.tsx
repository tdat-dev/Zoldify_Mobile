import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useInfiniteProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';
import { HomeHeader } from '@/features/products/components/home-header';
import { NewArrivalsRail } from '@/features/products/components/new-arrivals-rail';
import { QuickLinks } from '@/features/products/components/quick-links';
import { CategoryChips } from '@/features/categories/components/category-chips';

/**
 * Trang chủ theo tư duy CHỢ ĐỒ CŨ (xem docs/ba-home-cho-do-cu.md):
 * header → lối tắt → chip danh mục → "Mới về" (cuộn ngang) → "Dạo chợ" (feed
 * 2 cột CUỘN VÔ HẠN, khối chính). Khách chưa đăng nhập vẫn lượn được.
 */
export default function HomeScreen() {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(10);

  const items = data?.pages.flatMap((p) => p.result) ?? [];

  if (isPending) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <HomeHeader />
        <View style={styles.fill}>
          <ActivityIndicator size="large" color={Palette.brand} />
          <Text variant="bodyMuted" style={styles.hint}>Đang tải chợ…</Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <HomeHeader />
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
      <StatusBar style="dark" />
      <HomeHeader />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <QuickLinks />
            <CategoryChips />
            <NewArrivalsRail />
            <Text variant="heading" style={styles.sectionTitle}>Dạo chợ</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyMuted">Chưa có món nào trong chợ.</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Palette.brand} />
            </View>
          ) : !hasNextPage && items.length > 0 ? (
            <Text style={styles.end}>Hết rồi — bạn đã lượn hết chợ.</Text>
          ) : null
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  hint: { textAlign: 'center' },
  retry: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 24 },
  // Header khối kéo mép ngang riêng vì rail/chip cần chạm mép; grid có padding 12.
  header: { marginHorizontal: -12, marginTop: -12, paddingTop: 12 },
  list: { padding: 12, gap: 18 },
  column: { gap: 12 },
  sectionTitle: { marginBottom: 2, paddingHorizontal: 12 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  footer: { paddingVertical: 20 },
  end: { textAlign: 'center', paddingVertical: 20, color: Palette.inkFaint, fontSize: 12.5 },
});
