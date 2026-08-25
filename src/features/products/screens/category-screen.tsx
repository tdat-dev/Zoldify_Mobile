import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useInfiniteProducts } from '@/features/products/api';
import { FilterBar } from '@/features/products/components/filter-bar';
import { ProductCard } from '@/features/products/components/product-card';
import { ProductGridSkeleton } from '@/features/products/components/product-grid-skeleton';
import { EMPTY_QUERY, toProductFilters, type ProductQuery } from '@/features/products/filters';

/** Danh sách sản phẩm theo danh mục — cuộn vô hạn + sắp xếp/lọc dùng chung. */
export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState<ProductQuery>(EMPTY_QUERY);

  const filters = toProductFilters(query, { category_id: Number(id) });
  const {
    data,
    isPending,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(20, filters);

  const items = data?.pages.flatMap((p) => p.result) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Pressable hitSlop={12} onPress={back} accessibilityLabel="Quay lại">
        <View style={styles.chevron} />
      </Pressable>
      <Text variant="heading" numberOfLines={1} style={styles.title}>
        {name ?? 'Danh mục'}
      </Text>
      <View style={styles.side} />
    </View>
  );

  if (isError) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.fill}>
          <Text variant="bodyMuted" style={styles.hint}>Không tải được sản phẩm.</Text>
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
      <FilterBar value={query} onChange={setQuery} />

      {isPending ? (
        <ProductGridSkeleton count={6} />
      ) : (
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
            items.length > 0 ? (
              <Text variant="caption" style={styles.count}>{total} món</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.fill}>
              <Text variant="bodyMuted">Không có món nào khớp bộ lọc.</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={Palette.brand} />
              </View>
            ) : !hasNextPage && items.length > 0 ? (
              <Text style={styles.end}>Hết danh mục này rồi.</Text>
            ) : null
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  chevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.ink,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  title: { flex: 1 },
  side: { width: 19 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  hint: { textAlign: 'center' },
  retry: { alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { padding: 12, gap: 18 },
  column: { gap: 12 },
  count: { marginBottom: 4 },
  footer: { paddingVertical: 20 },
  end: { textAlign: 'center', paddingVertical: 20, color: Palette.inkFaint, fontSize: 12.5 },
});
