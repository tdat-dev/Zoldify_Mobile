import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';
import { HomeHeader } from '@/features/products/components/home-header';
import { QuickLinks } from '@/features/products/components/quick-links';
import { CategoryRail } from '@/features/categories/components/category-rail';

/**
 * Trang chủ ecommerce — đúng ngôn ngữ web mới: header MỘT TẦNG nền sáng (logo
 * + tiện ích + giỏ hàng trên cùng), hàng lối tắt, dải danh mục, rồi feed sản
 * phẩm trên nền xám nhạt. Khách chưa đăng nhập vẫn duyệt được.
 */
export default function HomeScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useProducts(1, 20);

  if (isPending) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <HomeHeader />
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
        data={data.result}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View>
            <QuickLinks />
            <CategoryRail />
            <Text variant="heading" style={styles.sectionTitle}>Mới đăng</Text>
          </View>
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
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  hint: { textAlign: 'center' },
  retry: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { padding: 12, gap: 18 },
  column: { gap: 12 },
  sectionTitle: { marginBottom: 2 },
  empty: { paddingVertical: 48, alignItems: 'center' },
});
