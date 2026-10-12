import Feather from '@expo/vector-icons/Feather';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HeartButton } from '@/components/ui/heart-button';
import { ImageGallery } from '@/components/ui/image-gallery';
import { RatingStars } from '@/components/ui/rating';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProduct } from '@/features/products/api';
import { CONDITION_LABEL, isFreshCondition } from '@/features/products/filters';
import { RelatedRail } from '@/features/products/components/related-rail';
import { ProductDetailSkeleton } from '@/features/products/components/product-detail-skeleton';
import { useStartConversation } from '@/features/chat/api';
import { useProductReviews, useSellerStats } from '@/features/reviews/api';
import { ReviewCard } from '@/features/reviews/components/review-card';
import { useAddToCart, useCartCount } from '@/features/cart/api';
import { useAuthStore } from '@/features/auth/store';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { formatVnd } from '@/lib/format';
import { shareProduct } from '@/lib/share';

/** Chi tiết sản phẩm — token web: giá đỏ, góc 4px, badge tình trạng. */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const me = useAuthStore((s) => s.user);
  const startConv = useStartConversation();
  const addToCart = useAddToCart();
  const [mode, setMode] = useState<null | 'add' | 'buy'>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const { data: cartCount = 0 } = useCartCount();
  const { data: product, isPending, isError, refetch } = useProduct(Number(id));
  // Số thật từ backend (lỗi H-01: trước đây sinh ngẫu nhiên trong mock.ts).
  // Gọi trước các nhánh return sớm để thứ tự hook không đổi.
  const { data: reviewData } = useProductReviews(Number(id), 3);
  const { data: sStats } = useSellerStats(product?.seller?.id);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Thanh trên: back + ô tìm kiếm + tin nhắn + giỏ (đồng nhất với trang chủ).
  const topBar = (
    <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <Pressable style={styles.tbBack} hitSlop={8} onPress={back} accessibilityLabel="Quay lại">
        <View style={styles.chevron} />
      </Pressable>
      <Pressable style={styles.searchPill} onPress={() => router.push('/search')}>
        <Feather name="search" size={16} color={Palette.inkMuted} />
        <Text style={styles.searchPlaceholder} numberOfLines={1}>
          Tìm đồ cũ & mới trên Zoldify
        </Text>
      </Pressable>
      <Pressable style={styles.tbIcon} hitSlop={4} onPress={() => router.push('/messages')}>
        <Feather name="message-circle" size={22} color={Palette.white} />
      </Pressable>
      <Pressable style={styles.tbIcon} hitSlop={4} onPress={() => router.push('/cart')}>
        <Feather name="shopping-cart" size={22} color={Palette.white} />
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
      { product_id: product!.id, quantity: qty },
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
    // Mua ngay: thêm vào giỏ rồi vào THẲNG thanh toán, chỉ món này (param `only`).
    // Đặt xong backend tự xoá cart item nên không đọng trong giỏ.
    addToCart.mutate(
      { product_id: product!.id, quantity: qty },
      {
        onSuccess: (item) => router.push({ pathname: '/checkout', params: { only: item.id } }),
        onError: cartError,
        onSettled: () => setMode(null),
      },
    );
  };

  if (isPending) {
    return (
      <View style={styles.root}>
        {topBar}
        <ProductDetailSkeleton />
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

  const fresh = isFreshCondition(product.condition);
  const condLabel = CONDITION_LABEL[product.condition] ?? product.condition;
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const seller = product.seller;
  const joinedYear = seller ? new Date(seller.created_at).getFullYear() : null;
  const rating = { rating: Number(product.rating_avg ?? 0), count: product.review_count ?? 0 };
  const reviews = reviewData?.reviews ?? [];

  const onMessage = () => {
    if (guest) return requireAuth();
    if (!seller) return;
    // Không nhắn cho chính mình — về danh sách hội thoại.
    if (me?.id === seller.id) return router.push('/messages');
    startConv.mutate(
      { seller_id: seller.id, product_id: product!.id },
      {
        onSuccess: (c) => router.push({ pathname: '/chat/[id]', params: { id: String(c.id) } }),
        onError: () => setErrMsg('Chưa mở được tin nhắn. Thử lại nhé.'),
      },
    );
  };

  return (
    <View style={styles.root}>
      {topBar}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          <ImageGallery images={images} />
          {/* Lưu (tim) nổi trên ảnh — hành vi lõi khi lướt đồ cũ. */}
          <HeartButton productId={product.id} floating style={styles.heart} />
          {/* Chia sẻ ra ngoài (link web) — cạnh trái tim. */}
          <Pressable
            style={styles.share}
            hitSlop={8}
            onPress={() => shareProduct(product)}
            accessibilityRole="button"
            accessibilityLabel="Chia sẻ sản phẩm">
            <Feather name="share-2" size={18} color={Palette.ink} />
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

          {rating.count > 0 ? (
            <View style={styles.ratingRow}>
              <RatingStars value={rating.rating} count={rating.count} size={15} />
            </View>
          ) : null}

          <View style={styles.metaRow}>
            {product.brand ? <Text variant="caption">Hãng: {product.brand}</Text> : null}
            {product.sold_count > 0 ? <Text variant="caption">Đã bán {product.sold_count}</Text> : null}
            {product.view_count > 0 ? <Text variant="caption">{product.view_count} lượt xem</Text> : null}
          </View>

          {/* Số lượng — sàn bán CẢ đồ cũ (thường 1 món) lẫn mới (nhiều tồn kho).
              stock>1: cho chọn số lượng; stock<=1: chỉ báo "còn 1". */}
          {(product.stock ?? 1) > 1 ? (
            <View style={styles.qtyRow}>
              <Text variant="subheading">Số lượng</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  disabled={qty <= 1}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  accessibilityLabel="Giảm số lượng">
                  <Feather name="minus" size={16} color={qty <= 1 ? Palette.inkFaint : Palette.ink} />
                </Pressable>
                <Text style={styles.qtyVal}>{qty}</Text>
                <Pressable
                  style={styles.stepBtn}
                  disabled={qty >= (product.stock ?? 1)}
                  onPress={() => setQty((q) => Math.min(product.stock ?? 1, q + 1))}
                  accessibilityLabel="Tăng số lượng">
                  <Feather name="plus" size={16} color={qty >= (product.stock ?? 1) ? Palette.inkFaint : Palette.ink} />
                </Pressable>
              </View>
              <Text variant="caption" style={styles.stockHint}>Còn {product.stock} sản phẩm</Text>
            </View>
          ) : (
            <View style={styles.uniqueRow}>
              <Feather name="check-circle" size={13} color={Palette.successFg} />
              <Text variant="caption" style={styles.uniqueText}>Chỉ còn 1 sản phẩm</Text>
            </View>
          )}

          {/* Người bán — đồ cũ mua vì TIN người bán; hiện dữ liệu thật + lối nhắn. */}
          {seller ? (
            <View style={styles.sellerCard}>
              <Pressable
                style={styles.sellerTap}
                onPress={() =>
                  router.push({
                    pathname: '/shop/[id]',
                    params: { id: seller.id, name: seller.full_name, avatar: seller.avatar ?? '' },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Xem cửa hàng ${seller.full_name}`}>
                <Avatar name={seller.full_name} uri={seller.avatar} size={44} />
                <View style={styles.sellerInfo}>
                  <Text variant="subheading" numberOfLines={1}>{seller.full_name}</Text>
                  {sStats && sStats.review_count > 0 ? (
                    <RatingStars value={sStats.rating} count={sStats.review_count} size={12} style={styles.sellerRating} />
                  ) : null}
                  <Text variant="caption">
                    {[
                      sStats && sStats.sold_count > 0 ? `Đã bán ${sStats.sold_count}` : null,
                      joinedYear ? `Từ ${joinedYear}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={Palette.inkFaint} />
              </Pressable>
              <Pressable style={styles.msgBtn} onPress={onMessage} accessibilityRole="button">
                <Feather name="message-circle" size={15} color={Palette.brand} />
                <Text style={styles.msgText}>Nhắn</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Thông tin món — tách rõ tình trạng/hãng/mã, đặc trưng đồ cũ. */}
          <Text variant="heading" style={styles.descHead}>Thông tin</Text>
          <View style={styles.infoList}>
            <InfoRow label="Tình trạng" value={condLabel} />
            {product.brand ? <InfoRow label="Thương hiệu" value={product.brand} /> : null}
            {product.spec ? <InfoRow label="Thông số" value={product.spec} /> : null}
            <InfoRow label="Giao hàng" value={product.is_freeship ? 'Miễn phí vận chuyển' : 'Tính phí theo đơn'} />
          </View>

          <View style={styles.divider} />

          <Text variant="heading" style={styles.descHead}>Mô tả</Text>
          <Text variant="body" style={styles.desc}>
            {product.description || 'Người bán chưa thêm mô tả.'}
          </Text>

          <View style={styles.divider} />

          {/* Đánh giá — tín hiệu tin tưởng chính của sàn đồ cũ. */}
          <View style={styles.reviewHead}>
            <Text variant="heading">Đánh giá</Text>
            {rating.count > 0 ? <RatingStars value={rating.rating} count={rating.count} size={13} /> : null}
          </View>
          {rating.count > 0 ? (
            <>
              <View style={styles.reviewList}>
                {reviews.map((rv) => (
                  <ReviewCard key={rv.id} review={rv} />
                ))}
              </View>
              <Pressable
                style={styles.seeAll}
                onPress={() => router.push({ pathname: '/reviews/[id]', params: { id: product.id } })}>
                <Text style={styles.seeAllText}>Xem tất cả {rating.count} đánh giá</Text>
                <Feather name="chevron-right" size={16} color={Palette.brand} />
              </Pressable>
            </>
          ) : (
            <Text variant="bodyMuted">Chưa có đánh giá nào cho món này.</Text>
          )}
        </View>

        {seller ? (
          <RelatedRail
            title="Thêm từ shop này"
            filters={{ seller_id: seller.id }}
            excludeId={product.id}
          />
        ) : null}
        {product.category ? (
          <RelatedRail
            title="Sản phẩm tương tự"
            filters={{ category_id: product.category.id }}
            excludeId={product.id}
          />
        ) : null}
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

/** Một dòng thông tin món: nhãn xám bên trái, giá trị bên phải. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="caption" style={styles.infoLabel}>{label}</Text>
      <Text variant="label" style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Palette.surfacePage },
  pad: { paddingHorizontal: 24 },
  retry: { alignSelf: 'stretch', paddingHorizontal: 24, gap: 8 },
  heart: { position: 'absolute', top: 12, right: 12 },
  share: {
    position: 'absolute',
    top: 12,
    right: 54,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: Palette.brand,
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
    backgroundColor: Palette.white,
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
    borderColor: Palette.white,
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
    lineHeight: 32,
    color: Palette.price,
    fontVariant: ['tabular-nums'],
  },
  ratingRow: { marginTop: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    borderRadius: Radius.control,
    overflow: 'hidden',
  },
  stepBtn: { width: 34, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.surfaceCard },
  qtyVal: { width: 40, textAlign: 'center', fontFamily: Font.semibold, fontSize: 15, color: Palette.ink, fontVariant: ['tabular-nums'] },
  stockHint: { color: Palette.inkFaint },
  uniqueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  uniqueText: { color: Palette.inkMuted },
  divider: { height: 1, backgroundColor: Palette.lineStrong, marginVertical: 16 },
  descHead: { marginBottom: 8 },
  desc: { color: Palette.ink },
  sellerRating: { marginVertical: 2 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  reviewList: { gap: 12 },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
  },
  seeAllText: { fontFamily: Font.semibold, fontSize: 13.5, color: Palette.brand },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.white,
  },
  sellerTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerInfo: { flex: 1, gap: 2 },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.brand,
    backgroundColor: Palette.brandTint,
  },
  msgText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.brand },
  infoList: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoLabel: { width: 96 },
  infoValue: { flex: 1, color: Palette.ink },
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
