import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette } from '@/components/ui/theme';
import { useProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';

/**
 * "Mới về" — món mới đăng, cuộn ngang. Ở chợ đồ cũ mỗi món là duy nhất nên
 * "mới về" đúng động lực hơn "flash sale": ai nhanh người đó được. Bấm "Xem
 * thêm" mở tìm kiếm để lượn tiếp.
 */
const CARD_WIDTH = 150;

export function NewArrivalsRail() {
  const { data } = useProducts(1, 10);
  const items = data?.result ?? [];
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text variant="heading">Mới về</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/search')}>
          <Text style={styles.more}>Xem thêm</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
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
  wrap: { marginBottom: 18 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  more: { fontFamily: Font.semibold, fontSize: 13, color: Palette.brand },
  row: { gap: 12, paddingHorizontal: 12 },
  card: { width: CARD_WIDTH },
});
