import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RatingStars } from '@/components/ui/rating';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import { useFollowing, type FollowedUser } from '@/features/follows/api';
import { sellerStats } from '@/features/reviews/mock';

function ShopRow({ shop }: { shop: FollowedUser }) {
  const stats = sellerStats(shop.id);
  return (
    <Pressable
      style={styles.row}
      onPress={() =>
        router.push({
          pathname: '/shop/[id]',
          params: { id: shop.id, name: shop.full_name ?? '', avatar: shop.avatar ?? '' },
        })
      }>
      <Avatar name={shop.full_name} uri={shop.avatar} size={48} />
      <View style={styles.body}>
        <Text variant="subheading" numberOfLines={1}>{shop.full_name ?? 'Cửa hàng'}</Text>
        <RatingStars value={stats.rating} count={stats.reviewCount} size={12} style={styles.stars} />
      </View>
      <Feather name="chevron-right" size={18} color={Palette.inkFaint} />
    </Pressable>
  );
}

/** Danh sách shop người dùng đang theo dõi (khép vòng nút Theo dõi ở trang shop). */
export default function FollowingScreen() {
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const { data: shops, isPending, isError, refetch, isFetching } = useFollowing(me?.id);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/account'));

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <BackChevron onPress={back} />
      <Text variant="title">Đang theo dõi</Text>
    </View>
  );

  if (guest) {
    return (
      <View style={styles.root}>
        {header}
        <EmptyState
          icon="users"
          title="Theo dõi shop yêu thích"
          subtitle="Đăng nhập để theo dõi người bán và xem hàng mới của họ."
          actionLabel="Đăng nhập"
          onAction={() => router.push('/login')}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      {isPending ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="heading">Không tải được danh sách</Text>
          <View style={styles.cta}><Button title="Thử lại" onPress={() => refetch()} /></View>
        </View>
      ) : (shops ?? []).length === 0 ? (
        <EmptyState
          icon="users"
          title="Chưa theo dõi shop nào"
          subtitle="Vào trang cửa hàng và bấm Theo dõi để không bỏ lỡ hàng mới."
        />
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching}
          onRefresh={refetch}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => <ShopRow shop={item} />}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  cta: { alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { paddingVertical: 4 },
  sep: { height: 1, backgroundColor: Palette.line, marginLeft: 72 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Palette.white,
  },
  body: { flex: 1, gap: 3 },
  stars: { marginTop: 1 },
});
