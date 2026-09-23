import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRowSkeleton } from '@/components/ui/list-row-skeleton';
import { Text } from '@/components/ui/text';
import { Font, Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import { useConversations, type Conversation } from '@/features/chat/api';
import { timeAgo } from '@/lib/format';

function ConversationRow({ item }: { item: Conversation }) {
  const preview = item.last_message?.content ?? 'Bắt đầu trò chuyện';
  const unread = item.unread_count > 0;
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}>
      <Avatar name={item.partner_name} uri={item.partner_avatar} size={52} />
      <View style={styles.body}>
        <View style={styles.line1}>
          <Text variant="subheading" numberOfLines={1} style={styles.name}>{item.partner_name ?? 'Người dùng'}</Text>
          <Text variant="caption" style={styles.time}>{timeAgo(item.updated_at)}</Text>
        </View>
        {item.product?.name ? (
          <Text variant="caption" numberOfLines={1} style={styles.product}>Về: {item.product.name}</Text>
        ) : null}
        <Text variant="bodyMuted" numberOfLines={1} style={unread ? styles.previewUnread : undefined}>
          {preview}
        </Text>
      </View>
      {unread ? <View style={styles.badge}><Text style={styles.badgeText}>{item.unread_count}</Text></View> : null}
    </Pressable>
  );
}

/** Danh sách hội thoại (thay placeholder). Mở từ icon tin nhắn / Nhắn người bán. */
export default function ConversationListScreen() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const { data: list, isPending, isError, isFetching, refetch } = useConversations();

  useFocusEffect(useCallback(() => { if (!guest) refetch(); }, [guest, refetch]));

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <BackChevron onPress={back} />
      <Text variant="title">Tin nhắn</Text>
    </View>
  );

  if (guest) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading" style={styles.line}>Tin nhắn của bạn</Text>
          <Text variant="bodyMuted" style={styles.line}>Đăng nhập để nhắn với người bán.</Text>
          <View style={styles.cta}><Button title="Đăng nhập" onPress={() => router.push('/login')} /></View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      {isPending ? (
        <ListRowSkeleton />
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="heading">Không tải được tin nhắn</Text>
          <View style={styles.cta}><Button title="Thử lại" onPress={() => refetch()} /></View>
        </View>
      ) : (list ?? []).length === 0 ? (
        <EmptyState
          icon="message-circle"
          title="Chưa có hội thoại"
          subtitle="Nhắn người bán từ trang sản phẩm để bắt đầu trao đổi."
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Palette.brand} />}
          renderItem={({ item }) => <ConversationRow item={item} />}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { paddingVertical: 4 },
  sep: { height: 1, backgroundColor: Palette.line, marginLeft: 76 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Palette.white, alignItems: 'center' },
  body: { flex: 1, gap: 2 },
  line1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1 },
  time: { color: Palette.inkFaint },
  product: { color: Palette.inkFaint },
  previewUnread: { color: Palette.ink, fontFamily: Font.semibold },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: Palette.brand, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: Font.bold, fontSize: 11, color: Palette.white },
});
