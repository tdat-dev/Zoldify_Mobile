import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProduct } from '@/features/products/api';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { formatVnd } from '@/lib/format';

const CONDITION_LABEL: Record<string, string> = {
  new: 'Mới',
  like_new: 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
  used: 'Đã dùng',
  refurbished: 'Tân trang',
};

/** Chi tiết sản phẩm — token web: giá đỏ, góc 4px, badge tình trạng. */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const { data: product, isPending, isError, refetch } = useProduct(Number(id));

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Palette.brand} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.center, styles.pad]}>
        <Text variant="heading">Không tải được sản phẩm</Text>
        <View style={styles.retry}>
          <Button title="Thử lại" onPress={() => refetch()} />
          <Button title="Quay lại" variant="ghost" onPress={back} />
        </View>
      </View>
    );
  }

  const fresh = product.condition === 'new' || product.condition === 'like_new';
  const condLabel = CONDITION_LABEL[product.condition] ?? product.condition;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.imageWrap}>
          <Image source={product.image} style={styles.image} contentFit="cover" transition={160} />
          <Pressable style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={10} onPress={back}>
            <View style={styles.chevron} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.chips}>
            {condLabel ? (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: fresh ? Palette.successBg : Palette.neutralBg },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    { color: fresh ? Palette.successFg : Palette.neutralFg },
                  ]}>
                  {condLabel}
                </Text>
              </View>
            ) : null}
            {product.is_freeship ? (
              <View style={[styles.chip, { backgroundColor: Palette.brandTint }]}>
                <Text style={[styles.chipText, { color: Palette.brand }]}>Freeship</Text>
              </View>
            ) : null}
          </View>

          <Text variant="title" style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatVnd(product.price)}</Text>

          <View style={styles.metaRow}>
            {product.brand ? <Text variant="caption">Hãng: {product.brand}</Text> : null}
            {product.sold_count > 0 ? <Text variant="caption">Đã bán {product.sold_count}</Text> : null}
          </View>

          <View style={styles.divider} />

          <Text variant="heading" style={styles.descHead}>Mô tả</Text>
          <Text variant="body" style={styles.desc}>
            {product.description || 'Người bán chưa thêm mô tả.'}
          </Text>

          {product.seller ? (
            <>
              <View style={styles.divider} />
              <Text variant="caption">Người bán</Text>
              <Text variant="subheading" style={styles.seller}>{product.seller.full_name}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerBtn}>
          <Button title="Thêm vào giỏ" variant="secondary" onPress={() => requireAuth()} />
        </View>
        <View style={styles.footerBtn}>
          <Button title="Mua ngay" onPress={() => requireAuth()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Palette.surfacePage },
  pad: { paddingHorizontal: 24 },
  retry: { alignSelf: 'stretch', paddingHorizontal: 24, gap: 8 },
  imageWrap: { aspectRatio: 1, backgroundColor: Palette.surfaceSunken },
  image: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    left: 12,
    width: 38,
    height: 38,
    borderRadius: Radius.control,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
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
  body: { padding: 16 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { borderRadius: Radius.control, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontFamily: Font.semibold, fontSize: 12 },
  name: { marginBottom: 8 },
  price: {
    fontFamily: Font.extrabold,
    fontSize: 26,
    color: Palette.price,
    fontVariant: ['tabular-nums'],
  },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  divider: { height: 1, backgroundColor: Palette.lineStrong, marginVertical: 16 },
  descHead: { marginBottom: 6 },
  desc: { color: Palette.ink },
  seller: { marginTop: 4 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  footerBtn: { flex: 1 },
});
