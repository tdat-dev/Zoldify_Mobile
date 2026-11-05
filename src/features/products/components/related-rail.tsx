import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useProducts, type ProductFilters } from '@/features/products/api';
import type { Product } from '@/api';
import { ProductCard } from '@/features/products/components/product-card';

/**
 * Rail sản phẩm liên quan cho trang chi tiết — "Thêm từ shop này" (lọc theo
 * seller_id) và "Sản phẩm tương tự" (lọc theo category_id). Dữ liệu THẬT qua
 * useProducts; loại món đang xem; rỗng thì tự ẩn (không để tiêu đề trơ khoảng
 * trắng). Chỉ mount khi đã có product nên filters luôn hợp lệ.
 */
const CARD_WIDTH = 150;
const RAIL_MAX = 8;
const SHOP_LIMIT = 10;
/** Lấy rộng hơn cho rail "tương tự" vì còn phải bỏ các món đã có ở rail shop. */
const SIMILAR_LIMIT = 24;

export function RelatedRail({
  title,
  filters,
  excludeId,
}: {
  title: string;
  filters: ProductFilters;
  excludeId: number;
}) {
  const { data } = useProducts(1, SHOP_LIMIT, filters);
  const items = (data?.result ?? []).filter((p) => p.id !== excludeId).slice(0, RAIL_MAX);
  return <RailView title={title} items={items} />;
}

/**
 * Hai rail cuối trang chi tiết: "Thêm từ shop này" (cùng người bán) và "Sản phẩm
 * tương tự" (cùng danh mục). Trước đây hai rail lấy độc lập nên khi gần hết món
 * thuộc một shop, hai rail giống hệt nhau (D-16, E2E 02/11). Giờ rail tương tự
 * bỏ các món đã hiện ở rail shop; còn lại không món nào thì tự ẩn.
 */
export function ProductRelatedRails({ product }: { product: Product }) {
  const sellerId = product.seller?.id;
  const categoryId = product.category?.id;
  const shop = useProducts(1, SHOP_LIMIT, { seller_id: sellerId }, !!sellerId);
  const similar = useProducts(1, SIMILAR_LIMIT, { category_id: categoryId }, !!categoryId);

  const shopItems = sellerId
    ? (shop.data?.result ?? []).filter((p) => p.id !== product.id).slice(0, RAIL_MAX)
    : [];
  const shown = new Set(shopItems.map((p) => p.id));
  const similarItems = categoryId
    ? (similar.data?.result ?? []).filter((p) => p.id !== product.id && !shown.has(p.id)).slice(0, RAIL_MAX)
    : [];

  return (
    <>
      <RailView title="Thêm từ shop này" items={shopItems} />
      <RailView title="Sản phẩm tương tự" items={similarItems} />
    </>
  );
}

function RailView({ title, items }: { title: string; items: Product[] }) {
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
