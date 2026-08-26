import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
  type AppNotification,
  type NotificationType,
} from '@/features/notifications/api';
import { TabPlaceholder } from '@/features/shared/tab-placeholder';
import { timeAgo } from '@/lib/format';

const META: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string }> = {
  order_status: { icon: 'receipt-outline', fg: Palette.brand, bg: Palette.brandTint },
  message: { icon: 'chatbubble-outline', fg: Palette.brand, bg: Palette.brandTint },
  payment: { icon: 'wallet-outline', fg: Palette.successFg, bg: Palette.successBg },
  review: { icon: 'star-outline', fg: Palette.pendingFg, bg: Palette.pendingBg },
  new_product: { icon: 'pricetag-outline', fg: Palette.brand, bg: Palette.brandTint },
  system: { icon: 'megaphone-outline', fg: Palette.inkMuted, bg: Palette.surfaceSunken },
};

/** Điều hướng theo loại thông báo (data mang id kèm theo nếu có). */
function routeFor(n: AppNotification) {
  const d = n.data ?? {};
  if (n.type === 'order_status') {
    const id = d.order_id ?? d.orderId;
    return id ? { pathname: '/orders/[id]' as const, params: { id: String(id) } } : ('/orders' as const);
  }
  if (n.type === 'message') return '/messages' as const;
  if (n.type === 'payment') return '/orders' as const;
  if (n.type === 'new_product') {
    const id = d.product_id ?? d.productId;
    return id ? { pathname: '/products/[id]' as const, params: { id: String(id) } } : null;
  }
  return null;
}

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const m = META[item.type] ?? META.system;
  return (
    <Pressable style={[styles.row, !item.is_read && styles.rowUnread]} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: m.bg }]}>
        <Ionicons name={m.icon} size={20} color={m.fg} />
      </View>
      <View style={styles.body}>
        <Text variant="subheading" numberOfLines={1} style={!item.is_read ? styles.titleUnread : undefined}>
          {item.title}
        </Text>
        <Text variant="bodyMuted" numberOfLines={2} style={styles.content}>{item.content}</Text>
        <Text variant="caption" style={styles.time}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

/** Tab Thông báo — nhóm theo đã/chưa đọc bằng nền, tap để đọc + điều hướng. */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';

  const { data, isPending, isError, isFetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useFocusEffect(useCallback(() => { if (!guest) refetch(); }, [guest, refetch]));

  if (guest) {
    return <TabPlaceholder title="Thông báo" note="Đăng nhập để nhận thông báo đơn hàng, tin nhắn." />;
  }

  const items = data?.pages.flatMap((p) => p.result) ?? [];

  const onOpen = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    const to = routeFor(n);
    if (to) router.push(to as never);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text variant="title">Thông báo</Text>
        {unread > 0 ? (
          <Pressable hitSlop={6} onPress={() => markAll.mutate()}>
            <Text style={styles.readAll}>Đọc tất cả</Text>
          </Pressable>
        ) : null}
      </View>

      {isPending ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="heading">Không tải được thông báo</Text>
          <View style={styles.cta}><Button title="Thử lại" onPress={() => refetch()} /></View>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={44} color={Palette.inkFaint} />
          <Text variant="heading" style={styles.line}>Chưa có thông báo</Text>
          <Text variant="bodyMuted" style={styles.line}>Thông báo đơn hàng, tin nhắn sẽ hiện ở đây.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={<RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={refetch} tintColor={Palette.brand} />}
          onEndReachedThreshold={0.5}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          ListFooterComponent={isFetchingNextPage ? <View style={styles.footer}><ActivityIndicator color={Palette.brand} /></View> : null}
          renderItem={({ item }) => <NotificationRow item={item} onPress={() => onOpen(item)} />}
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
    justifyContent: 'space-between',
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  readAll: { fontFamily: Font.semibold, fontSize: 13, color: Palette.brand },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { paddingVertical: 4 },
  sep: { height: 1, backgroundColor: Palette.line, marginLeft: 64 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Palette.white, alignItems: 'flex-start' },
  rowUnread: { backgroundColor: Palette.brandTint },
  iconWrap: { width: 40, height: 40, borderRadius: Radius.control, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  titleUnread: { fontFamily: Font.bold },
  content: {},
  time: { color: Palette.inkFaint, marginTop: 2 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Palette.brand, marginTop: 6 },
  footer: { paddingVertical: 20 },
});
