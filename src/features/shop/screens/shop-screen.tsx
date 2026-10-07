import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/ui/rating';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import { useStartConversation } from '@/features/chat/api';
import { useFollowCount, useFollowStatus, useToggleFollow } from '@/features/follows/api';
import { useInfiniteProducts } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';
import { ProductGridSkeleton } from '@/features/products/components/product-grid-skeleton';
import { useSellerStats } from '@/features/reviews/api';

/**
 * Trang cửa hàng của một người bán: hồ sơ (avatar/tên/uy tín) + lưới hàng đang
 * bán (cuộn vô hạn). BE chưa có endpoint seller công khai (users/:id chặn admin),
 * nên danh tính lấy từ chính sản phẩm của shop; tên/avatar truyền qua param để
 * hiện tức thì. Uy tín (điểm, lượt đánh giá, đã bán) lấy từ GET /interactions/seller/:id/stats.
 */
export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { id, name, avatar } = useLocalSearchParams<{ id: string; name?: string; avatar?: string }>();
  const sellerId = Number(id);
  const me = useAuthStore((s) => s.user);
  const isMe = me?.id === sellerId;

  const {
    data,
    isPending,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(20, { seller_id: sellerId });

  const items = useMemo(() => data?.pages.flatMap((p) => p.result) ?? [], [data]);
  const total = data?.pages[0]?.meta.total ?? 0;

  // Danh tính: ưu tiên param (hiện ngay), bù bằng seller trong sản phẩm đầu tiên.
  const fromProduct = items[0]?.seller;
  const shopName = name || fromProduct?.full_name || 'Cửa hàng';
  const shopAvatar = avatar || fromProduct?.avatar || null;
  const joinedYear = fromProduct?.created_at ? new Date(fromProduct.created_at).getFullYear() : null;
  // Số thật (lỗi H-01: trước đây sinh ngẫu nhiên, kèm "% phản hồi" bịa).
  const { data: stats } = useSellerStats(sellerId);
  const hasReviews = (stats?.review_count ?? 0) > 0;

  const canFollow = !isMe && !!me;
  const { data: followed } = useFollowStatus(sellerId, canFollow);
  const { data: fcount } = useFollowCount(sellerId);
  const toggleFollow = useToggleFollow(sellerId);
  const onFollow = () => {
    if (!me) return router.push('/login');
    toggleFollow.mutate();
  };

  const startChat = useStartConversation();
  const onMessage = () => {
    if (isMe) return router.push('/messages');
    const firstProduct = items[0];
    if (!firstProduct) return; // chưa có món để mở hội thoại theo ngữ cảnh
    startChat.mutate(
      { seller_id: sellerId, product_id: firstProduct.id },
      { onSuccess: (conv) => router.push({ pathname: '/chat/[id]', params: { id: conv.id } }) },
    );
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <BackChevron onPress={back} />
      <Text variant="title" numberOfLines={1} style={styles.headerTitle}>{shopName}</Text>
    </View>
  );

  const hero = (
    <View style={styles.heroWrap}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Avatar name={shopName} uri={shopAvatar} size={60} />
          <View style={styles.heroInfo}>
            <Text variant="heading" numberOfLines={1}>{shopName}</Text>
            {hasReviews && stats ? (
              <RatingStars value={stats.rating} count={stats.review_count} size={13} style={styles.heroStars} />
            ) : null}
            <Text variant="caption" style={styles.joined}>
              {fcount ? `${fcount.follower} người theo dõi` : ''}
              {fcount && joinedYear ? ' · ' : ''}
              {joinedYear ? `Tham gia từ ${joinedYear}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{hasReviews && stats ? stats.rating.toFixed(1) : '–'}</Text>
            <Text variant="caption" style={styles.statLabel}>Điểm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{stats?.sold_count ?? 0}</Text>
            <Text variant="caption" style={styles.statLabel}>Đã bán</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{stats?.review_count ?? 0}</Text>
            <Text variant="caption" style={styles.statLabel}>Lượt đánh giá</Text>
          </View>
        </View>

        {!isMe ? (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.followBtn, followed && styles.followBtnOn]}
              onPress={onFollow}
              disabled={toggleFollow.isPending}
              accessibilityRole="button">
              <Feather
                name={followed ? 'check' : 'plus'}
                size={16}
                color={followed ? Palette.inkMuted : Palette.white}
              />
              <Text style={[styles.followText, followed && styles.followTextOn]}>
                {followed ? 'Đang theo dõi' : 'Theo dõi'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.msgBtn}
              onPress={onMessage}
              disabled={startChat.isPending || items.length === 0}
              accessibilityRole="button">
              <Feather name="message-circle" size={16} color={Palette.brand} />
              <Text style={styles.msgText}>{startChat.isPending ? 'Đang mở…' : 'Nhắn shop'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text variant="heading" style={styles.sectionTitle}>
        Đang bán{total ? ` (${total})` : ''}
      </Text>
    </View>
  );

  if (isError) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.fill}>
          <Text variant="bodyMuted" style={styles.center}>Không tải được cửa hàng.</Text>
          <View style={styles.retry}><Button title="Thử lại" onPress={() => refetch()} /></View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      {isPending ? (
        <>
          {hero}
          <ProductGridSkeleton count={4} />
        </>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListHeaderComponent={hero}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="package" size={28} color={Palette.inkFaint} />
              <Text variant="bodyMuted" style={styles.center}>Shop chưa đăng bán món nào.</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}><ActivityIndicator color={Palette.brand} /></View>
            ) : !hasNextPage && items.length > 0 ? (
              <Text style={styles.end}>Hết hàng của shop rồi.</Text>
            ) : null
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  headerTitle: { flex: 1 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  center: { textAlign: 'center' },
  retry: { alignSelf: 'stretch', paddingHorizontal: 24 },
  heroWrap: { gap: 2 },
  hero: {
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    padding: 16,
    gap: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroInfo: { flex: 1, gap: 4 },
  heroStars: { marginTop: 1 },
  joined: { color: Palette.inkFaint },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceSunken,
    borderRadius: Radius.control,
    paddingVertical: 12,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: Font.extrabold, fontSize: 17, color: Palette.ink, fontVariant: ['tabular-nums'] },
  statLabel: { color: Palette.inkMuted },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Palette.line, marginVertical: 4 },
  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.brand,
    backgroundColor: Palette.brand,
  },
  followBtnOn: { backgroundColor: Palette.surfaceCard, borderColor: Palette.lineStrong },
  followText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.white },
  followTextOn: { color: Palette.inkMuted },
  msgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.brand,
    backgroundColor: Palette.brandTint,
  },
  msgText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.brand },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  list: { paddingHorizontal: 12, paddingBottom: 12, gap: 18 },
  column: { gap: 12, paddingHorizontal: 0 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  footer: { paddingVertical: 20 },
  end: { textAlign: 'center', paddingVertical: 20, color: Palette.inkFaint, fontSize: 12.5 },
});
