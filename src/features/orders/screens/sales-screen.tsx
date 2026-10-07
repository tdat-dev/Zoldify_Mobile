import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRowSkeleton } from '@/components/ui/list-row-skeleton';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useSellerOrders } from '@/features/orders/api';
import { SALE_TABS, STATUS_META } from '@/features/orders/order-status';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import type { Order } from '@/api';

function SaleRow({ order }: { order: Order }) {
  const items = order.items ?? [];
  const first = items[0];
  const uri = mediaUrl(first?.product_image);
  const more = items.length - 1;
  const meta = STATUS_META[order.status];

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/sales/${order.id}` as Href)}>
      <View style={styles.cardHead}>
        <Text variant="caption" style={styles.code} selectable>#{order.order_code}</Text>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.fg }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.thumb}>
          {uri ? <Image source={uri} style={styles.thumbImg} contentFit="cover" /> : null}
        </View>
        <View style={styles.info}>
          <Text variant="body" numberOfLines={2}>{first?.product_name ?? 'Đơn hàng'}</Text>
          {more > 0 ? <Text variant="caption">và {more} món khác</Text> : null}
          <Text variant="caption" numberOfLines={1}>Giao cho {order.receiver_name}</Text>
        </View>
      </View>

      <View style={styles.cardFoot}>
        <Text variant="caption">{order.payment_method === 'cod' ? 'Thu hộ (COD)' : 'Đã trả qua app'}</Text>
        <Text style={styles.total}>{formatVnd(order.final_amount)}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Đơn bán: những đơn có hàng của tôi, chia theo việc phải làm (lỗi H-02 test
 * E2E 30/09: trước đây app không có chỗ nào cho người bán thấy đơn mới).
 */
export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(SALE_TABS[0].key);
  const { data: orders, isPending, isError, isFetching, refetch } = useSellerOrders();

  // Đơn mới tới bất cứ lúc nào (người mua đặt): mở lại màn là tải lại.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const all = orders ?? [];
  const activeTab = SALE_TABS.find((t) => t.key === tab) ?? SALE_TABS[0];
  const list = all.filter((o) => activeTab.match(o.status));
  const countOf = (key: string) => {
    const t = SALE_TABS.find((x) => x.key === key);
    return t ? all.filter((o) => t.match(o.status)).length : 0;
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/account'));

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron tone="light" onPress={back} />
        <Text variant="title">Đơn bán</Text>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {SALE_TABS.map((t) => {
            const on = t.key === tab;
            const n = countOf(t.key);
            // Số đếm chỉ hiện ở hai tab cần người bán ra tay.
            const showCount = n > 0 && (t.key === 'todo' || t.key === 'ship');
            return (
              <Pressable key={t.key} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(t.key)}>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>
                  {t.label}
                  {showCount ? ` (${n})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isPending ? (
        <ListRowSkeleton />
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="heading">Không tải được đơn bán</Text>
          <View style={styles.emptyCta}>
            <Button title="Thử lại" onPress={() => refetch()} />
          </View>
        </View>
      ) : list.length === 0 ? (
        <EmptyState
          icon="package"
          title={tab === 'todo' ? 'Chưa có đơn nào chờ bạn' : 'Không có đơn ở mục này'}
          subtitle={
            tab === 'todo'
              ? 'Khi có người đặt mua, đơn hiện ở đây và bạn nhận được thông báo.'
              : undefined
          }
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
          renderItem={({ item }) => <SaleRow order={item} />}
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
  code: { fontFamily: Font.semibold, color: Palette.inkMuted, fontVariant: ['tabular-nums'] },
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
