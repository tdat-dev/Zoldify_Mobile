import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useProducts, type ProductFilters } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';

/**
 * Rail sản phẩm liên quan cho trang chi tiết — "Thêm từ shop này" (lọc theo
 * seller_id) và "Sản phẩm tương tự" (lọc theo category_id). Dữ liệu THẬT qua
 * useProducts; loại món đang xem; rỗng thì tự ẩn (không để tiêu đề trơ khoảng
 * trắng). Chỉ mount khi đã có product nên filters luôn hợp lệ.
 */
const CARD_WIDTH = 150;

export function RelatedRail({
  title,
  filters,
  excludeId,
}: {
  title: string;
  filters: ProductFilters;
  excludeId: number;
}) {
  const { data } = useProducts(1, 10, filters);
  const items = (data?.result ?? []).filter((p) => p.id !== excludeId).slice(0, 8);
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <ProductCard product={item} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 8 },
  title: { paddingHorizontal: 16, marginBottom: 10 },
  row: { gap: 12, paddingHorizontal: 16 },
  card: { width: CARD_WIDTH },
});
