import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useProduct } from '@/features/products/api';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { formatVnd } from '@/lib/format';

/** Chi tiết sản phẩm — khách xem thoải mái; Mua/Giỏ mới cần đăng nhập. */
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

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.imageWrap}>
          <Image source={product.image} style={styles.image} contentFit="cover" transition={180} />
          <Pressable style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={10} onPress={back}>
            <View style={styles.chevron} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.chips}>
            {product.condition ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{product.condition}</Text>
              </View>
            ) : null}
            {product.is_freeship ? (
              <View style={[styles.chip, styles.chipSuccess]}>
                <Text style={[styles.chipText, { color: Palette.success }]}>Freeship</Text>
              </View>
            ) : null}
          </View>

          <Text variant="title" style={styles.name}>
            {product.name}
          </Text>
          <Text style={styles.price}>{formatVnd(product.price)}</Text>

          <View style={styles.metaRow}>
            {product.brand ? <Text variant="caption">Hãng: {product.brand}</Text> : null}
            {product.sold_count > 0 ? (
              <Text variant="caption">Đã bán {product.sold_count}</Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          <Text variant="heading" style={styles.descHead}>
            Mô tả
          </Text>
          <Text variant="body" style={styles.desc}>
            {product.description || 'Người bán chưa thêm mô tả.'}
          </Text>

          {product.seller ? (
            <>
              <View style={styles.divider} />
              <Text variant="caption">Người bán</Text>
              <Text variant="label" style={styles.seller}>
                {product.seller.full_name}
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerBtn}>
          <Button
            title="Thêm vào giỏ"
            variant="secondary"
            onPress={() => requireAuth()}
          />
        </View>
        <View style={styles.footerBtn}>
          <Button title="Mua ngay" onPress={() => requireAuth()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Palette.surface },
  pad: { paddingHorizontal: 24 },
  retry: { alignSelf: 'stretch', paddingHorizontal: 24, gap: 8 },
  imageWrap: { aspectRatio: 1, backgroundColor: Palette.brandLight },
  image: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
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
  body: { padding: 20 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: Palette.brandLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipSuccess: { backgroundColor: '#E7F6EC' },
  chipText: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: Palette.brand },
  name: { marginBottom: 8 },
  price: { fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 26, color: Palette.brand },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  divider: { height: 1, backgroundColor: Palette.line, marginVertical: 20 },
  descHead: { marginBottom: 8 },
  desc: { color: Palette.ink },
  seller: { marginTop: 4 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    backgroundColor: Palette.white,
  },
  footerBtn: { flex: 1 },
});
