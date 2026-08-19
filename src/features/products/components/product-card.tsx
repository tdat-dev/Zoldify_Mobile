import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import type { Product } from '@/api';
import { formatVnd } from '@/lib/format';

/**
 * Ô hàng — theo ItemTile của web: ảnh vuông, tên cắt 2 dòng, giá ĐỎ. Không
 * viền card, không chip overlay: gọn, dày, đọc như sổ kê.
 */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable
      style={styles.tile}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
      accessibilityRole="button">
      <View style={styles.imageWrap}>
        <Image source={product.image} style={styles.image} contentFit="cover" transition={160} />
      </View>

      <Text variant="body" numberOfLines={2} style={styles.name}>
        {product.name}
      </Text>
      <Text style={styles.price}>{formatVnd(product.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1 },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: Radius.control,
    backgroundColor: Palette.surfaceSunken,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  name: {
    marginTop: 8,
    minHeight: 44, // 2 dòng, giữ các thẻ cao bằng nhau
  },
  price: {
    marginTop: 2,
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.price,
    fontVariant: ['tabular-nums'],
  },
});
