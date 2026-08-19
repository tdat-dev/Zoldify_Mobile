import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';
import type { Product } from '@/api';
import { formatVnd } from '@/lib/format';

/** Thẻ sản phẩm trong lưới: ảnh vuông + tình trạng + freeship, tên, giá, đã bán. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
      accessibilityRole="button">
      <View style={styles.imageWrap}>
        <Image
          source={product.image}
          style={styles.image}
          contentFit="cover"
          transition={180}
        />
        {product.condition ? (
          <View style={styles.condition}>
            <Text style={styles.conditionText} numberOfLines={1}>
              {product.condition}
            </Text>
          </View>
        ) : null}
        {product.is_freeship ? (
          <View style={styles.freeship}>
            <Text style={styles.freeshipText}>Freeship</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text variant="body" numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatVnd(product.price)}</Text>
        {product.sold_count > 0 ? (
          <Text variant="caption">Đã bán {product.sold_count}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.line,
    overflow: 'hidden',
  },
  imageWrap: { aspectRatio: 1, backgroundColor: Palette.brandLight },
  image: { width: '100%', height: '100%' },
  condition: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  conditionText: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 11, color: Palette.ink },
  freeship: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Palette.success,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freeshipText: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 11, color: Palette.white },
  body: { padding: 12, gap: 4 },
  name: { fontSize: 14, lineHeight: 19 },
  price: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 16, color: Palette.brand, marginTop: 2 },
});
