import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import type { Product } from '@/api';
import { CONDITION_LABEL, isFreshCondition } from '@/features/products/filters';
import { productRating } from '@/features/reviews/mock';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';

/**
 * Ô hàng kiểu CHỢ ĐỒ CŨ — theo ItemTile web nhưng khoe tín hiệu tin tưởng:
 * chip TÌNH TRẠNG (đặc sản đồ cũ) + Freeship trên ảnh, "đã bán · lượt xem" dưới
 * giá, và phủ "ĐÃ BÁN" khi món đã bán (mỗi món là DUY NHẤT). Ảnh thiếu -> ô icon.
 */
export function ProductCard({ product }: { product: Product }) {
  const uri = mediaUrl(product.image);
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  const sold = product.status === 'sold';
  const fresh = isFreshCondition(product.condition);
  const condLabel = product.condition ? CONDITION_LABEL[product.condition] ?? product.condition : null;

  const soldCount = product.sold_count ?? 0;
  const viewCount = product.view_count ?? 0;
  const proof =
    soldCount > 0
      ? `Đã bán ${soldCount}${viewCount > 0 ? ` · ${viewCount} xem` : ''}`
      : viewCount > 0
        ? `${viewCount} lượt xem`
        : null;

  return (
    <Pressable
      style={styles.tile}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
      accessibilityRole="button">
      <View style={styles.imageWrap}>
        {showImage ? (
          <Image
            source={uri}
            style={[styles.image, sold && styles.imageSold]}
            contentFit="cover"
            transition={160}
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Feather name="image" size={26} color={Palette.inkFaint} />
          </View>
        )}

        {/* Chip tình trạng — góc trái, đặc sản đồ cũ. */}
        {condLabel ? (
          <View
            style={[
              styles.cond,
              { backgroundColor: fresh ? Palette.successBg : Palette.neutralBg },
            ]}>
            <Text
              style={[styles.condText, { color: fresh ? Palette.successFg : Palette.neutralFg }]}>
              {condLabel}
            </Text>
          </View>
        ) : null}

        {/* Freeship — góc phải. */}
        {product.is_freeship && !sold ? (
          <View style={styles.free}>
            <Text style={styles.freeText}>Freeship</Text>
          </View>
        ) : null}

        {/* Món là DUY NHẤT: bán rồi thì phủ "ĐÃ BÁN" thay vì ẩn. */}
        {sold ? (
          <View style={styles.soldBand}>
            <Text style={styles.soldText}>ĐÃ BÁN</Text>
          </View>
        ) : null}
      </View>

      <Text variant="body" numberOfLines={2} style={styles.name}>
        {product.name}
      </Text>
      <Text style={[styles.price, sold && styles.priceSold]}>{formatVnd(product.price)}</Text>
      <View style={styles.proofRow}>
        <Feather name="star" size={11} color={Palette.pendingFg} />
        <Text style={styles.rating}>{productRating(product.id).rating.toFixed(1)}</Text>
        {proof ? <Text style={styles.proof} numberOfLines={1}> · {proof}</Text> : null}
      </View>
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
  imageSold: { opacity: 0.55 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cond: {
    position: 'absolute',
    left: 6,
    top: 6,
    borderRadius: Radius.control,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  condText: { fontFamily: Font.semibold, fontSize: 10.5 },
  free: {
    position: 'absolute',
    right: 6,
    top: 6,
    borderRadius: Radius.control,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: Palette.brandTint,
  },
  freeText: { fontFamily: Font.semibold, fontSize: 10.5, color: Palette.brand },
  soldBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '42%',
    paddingVertical: 5,
    backgroundColor: 'rgba(25,32,41,0.62)',
    alignItems: 'center',
  },
  soldText: { fontFamily: Font.bold, fontSize: 13, color: Palette.white, letterSpacing: 1 },
  name: { marginTop: 8, minHeight: 44 },
  price: {
    marginTop: 2,
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.price,
    fontVariant: ['tabular-nums'],
  },
  priceSold: { color: Palette.inkMuted },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  rating: { fontFamily: Font.semibold, fontSize: 11.5, color: Palette.inkMuted },
  proof: { flex: 1, fontFamily: Font.regular, fontSize: 11.5, color: Palette.inkFaint },
});
