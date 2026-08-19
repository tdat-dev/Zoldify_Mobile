import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProduct } from '@/features/products/api';
import { useAddToCart, useCartCount } from '@/features/cart/api';
import { useAuthStore } from '@/features/auth/store';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';

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
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const addToCart = useAddToCart();
  const [mode, setMode] = useState<null | 'add' | 'buy'>(null);
  const [added, setAdded] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const { data: cartCount = 0 } = useCartCount();
  const { data: product, isPending, isError, refetch } = useProduct(Number(id));

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Thanh trên: back + ô tìm kiếm + tin nhắn + giỏ (đồng nhất với trang chủ).
  const topBar = (
    <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
      <Pressable style={styles.tbBack} hitSlop={8} onPress={back} accessibilityLabel="Quay lại">
        <View style={styles.chevron} />
      </Pressable>
      <Pressable style={styles.searchPill} onPress={() => router.push('/search')}>
        <Feather name="search" size={16} color={Palette.inkMuted} />
        <Text style={styles.searchPlaceholder} numberOfLines={1}>
          Tìm đồ cũ trên Zoldify
        </Text>
      </Pressable>
      <Pressable style={styles.tbIcon} hitSlop={4} onPress={() => router.push('/messages')}>
        <Feather name="message-circle" size={22} color={Palette.ink} />
      </Pressable>
      <Pressable style={styles.tbIcon} hitSlop={4} onPress={() => router.push('/cart')}>
        <Feather name="shopping-cart" size={22} color={Palette.ink} />
        {cartCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : String(cartCount)}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );

  const cartError = (e: unknown) => {
    const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    setErrMsg(typeof msg === 'string' ? msg : 'Chưa thêm được vào giỏ. Thử lại nhé.');
  };

  const onAdd = () => {
    if (guest) return requireAuth();
    setErrMsg(null);
    setMode('add');
    addToCart.mutate(
      { product_id: product!.id },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        },
        onError: cartError,
        onSettled: () => setMode(null),
      },
    );
  };

  const onBuy = () => {
    if (guest) return requireAuth();
    setErrMsg(null);
    setMode('buy');
    addToCart.mutate(
      { product_id: product!.id },
      {
        onSuccess: () => router.push('/cart'),
        onError: cartError,
        onSettled: () => setMode(null),
      },
    );
  };

  if (isPending) {
    return (
      <View style={styles.root}>
        {topBar}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.brand} />
        </View>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={styles.root}>
        {topBar}
        <View style={[styles.center, styles.pad]}>
          <Text variant="heading">Không tải được sản phẩm</Text>
          <View style={styles.retry}>
            <Button title="Thử lại" onPress={() => refetch()} />
            <Button title="Quay lại" variant="ghost" onPress={back} />
          </View>
        </View>
      </View>
    );
  }

  const fresh = product.condition === 'new' || product.condition === 'like_new';
  const condLabel = CONDITION_LABEL[product.condition] ?? product.condition;

  return (
    <View style={styles.root}>
      {topBar}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.imageWrap}>
          <Image source={mediaUrl(product.image)} style={styles.image} contentFit="cover" transition={160} />
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

      {errMsg ? (
        <View style={styles.errBar}>
          <Text variant="caption" style={styles.errText}>{errMsg}</Text>
        </View>
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerBtn}>
          <Button
            title={added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
            variant="secondary"
            loading={mode === 'add'}
            disabled={mode !== null}
            onPress={onAdd}
          />
        </View>
        <View style={styles.footerBtn}>
          <Button
            title="Mua ngay"
            loading={mode === 'buy'}
            disabled={mode !== null}
            onPress={onBuy}
          />
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
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: Palette.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  tbBack: { width: 34, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: Radius.control,
    backgroundColor: Palette.surfaceSunken,
  },
  searchPlaceholder: { flex: 1, fontFamily: Font.regular, fontSize: 13.5, color: Palette.inkFaint },
  tbIcon: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: Palette.price,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: Font.bold, fontSize: 9.5, color: Palette.white },
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
  errBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Palette.dangerBg,
  },
  errText: { color: Palette.dangerFg, textAlign: 'center' },
});
