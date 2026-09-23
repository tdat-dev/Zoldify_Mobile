import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRowSkeleton } from '@/components/ui/list-row-skeleton';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import { useOrders } from '@/features/orders/api';
import { ORDER_TABS, STATUS_META } from '@/features/orders/order-status';
import { TabPlaceholder } from '@/features/shared/tab-placeholder';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import type { Order } from '@/api';

function StatusBadge({ status }: { status: Order['status'] }) {
  const m = STATUS_META[status];
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }]}>
      <Text style={[styles.badgeText, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const items = order.items ?? [];
  const first = items[0];
  const uri = mediaUrl(first?.product_image);
  const more = items.length - 1;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}>
      <View style={styles.cardHead}>
        <Text variant="caption" style={styles.code}>#{order.order_code}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.thumb}>
          {uri ? <Image source={uri} style={styles.thumbImg} contentFit="cover" /> : null}
        </View>
        <View style={styles.info}>
          <Text variant="body" numberOfLines={2}>{first?.product_name ?? 'Đơn hàng'}</Text>
          {more > 0 ? <Text variant="caption">và {more} món khác</Text> : null}
        </View>
      </View>

      <View style={styles.cardFoot}>
        <Text variant="caption">{items.length} món</Text>
        <Text style={styles.total}>{formatVnd(order.final_amount)}</Text>
      </View>
    </Pressable>
  );
}

/** Đơn mua: khách → mời đăng nhập; đã đăng nhập → tab trạng thái + danh sách. */
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const [tab, setTab] = useState('all');
  const { data: orders, isPending, isError, isFetching, refetch } = useOrders();

  // Tab giữ mount nên không tự refetch — làm mới mỗi lần quay lại tab (trạng thái
  // đơn do người bán đổi ở server) + cho kéo xuống làm mới thủ công.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (guest) {
    return <TabPlaceholder title="Đơn mua" note="Đăng nhập để xem đơn hàng của bạn." />;
  }

  const activeTab = ORDER_TABS.find((t) => t.key === tab) ?? ORDER_TABS[0];
  const list = (orders ?? []).filter((o) => activeTab.match(o.status));

  const tabBar = (
    <View style={styles.tabsWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {ORDER_TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text variant="title">Đơn mua</Text>
      </View>
      {tabBar}

      {isPending ? (
        <ListRowSkeleton />
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="heading">Không tải được đơn hàng</Text>
          <View style={styles.emptyCta}>
            <Button title="Thử lại" onPress={() => refetch()} />
          </View>
        </View>
      ) : list.length === 0 ? (
        <EmptyState
          icon="package"
          title="Chưa có đơn nào"
          subtitle={tab === 'all' ? 'Mua món đầu tiên và theo dõi đơn ở đây nhé.' : 'Không có đơn ở trạng thái này.'}
          actionLabel={tab === 'all' ? 'Khám phá sản phẩm' : undefined}
          onAction={tab === 'all' ? () => router.push('/') : undefined}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isPending} onRefresh={refetch} tintColor={Palette.brand} />
          }
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabsWrap: { backgroundColor: Palette.white, borderBottomWidth: 1, borderBottomColor: Palette.line },
  tabs: { gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  tabOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  tabText: { fontFamily: Font.medium, fontSize: 13, color: Palette.ink },
  tabTextOn: { color: Palette.brand, fontFamily: Font.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyLine: { textAlign: 'center' },
  emptyCta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 16 },
  list: { padding: 12 },
  sep: { height: 12 },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 12,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontFamily: Font.semibold, color: Palette.inkMuted },
  badge: { borderRadius: Radius.control, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: Font.semibold, fontSize: 11.5 },
  cardBody: { flexDirection: 'row', gap: 12 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.control,
    backgroundColor: Palette.surfaceSunken,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 2 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingTop: 10,
  },
  total: { fontFamily: Font.bold, fontSize: 15, color: Palette.price, fontVariant: ['tabular-nums'] },
});
