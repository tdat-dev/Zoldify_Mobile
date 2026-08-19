import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';

/** Danh sách sản phẩm theo danh mục. Lọc bằng category_id (backend hỗ trợ). */
export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, refetch, isRefetching } = useProducts(1, 20, {
    category_id: Number(id),
  });

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

  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.fill}>
          <ActivityIndicator size="large" color={Palette.brand} />
        </View>
      </View>
    );
  }

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
      <FlatList
        data={data.result}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.fill}>
            <Text variant="bodyMuted">Danh mục này chưa có sản phẩm.</Text>
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
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
});
