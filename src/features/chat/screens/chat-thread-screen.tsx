import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BackChevron } from '@/components/ui/back-chevron';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  type ChatMessage,
} from '@/features/chat/api';
import { useChatRealtime } from '@/features/chat/realtime';
import { timeAgo } from '@/lib/format';
import { mediaUrl } from '@/lib/media';

function Bubble({ msg, mine, receipt }: { msg: ChatMessage; mine: boolean; receipt?: 'sent' | 'seen' }) {
  return (
    <View>
      <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {msg.content ? (
            <Text style={[styles.msgText, mine && styles.msgTextMine]}>{msg.content}</Text>
          ) : null}
          <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>{timeAgo(msg.created_at)}</Text>
        </View>
      </View>
      {/* Trạng thái đọc: chỉ hiện dưới tin cuối của mình (kiểu Messenger). */}
      {receipt ? (
        <Text style={styles.receipt}>{receipt === 'seen' ? 'Đã xem' : 'Đã gửi'}</Text>
      ) : null}
    </View>
  );
}

/** Cửa sổ trò chuyện với một người bán. */
export default function ChatThreadScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const convId = Number(id);
  const me = useAuthStore((s) => s.user);

  const { data: conversations } = useConversations();
  const conv = conversations?.find((c) => c.id === convId);
  const { data: messages, isPending } = useMessages(convId);
  const send = useSendMessage(convId);
  const realtime = useChatRealtime(convId, conv?.partner_id);
  const markRead = useMarkConversationRead();

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Tin (thật, không phải tin tạm id âm) cuối cùng do mình gửi -> gắn nhãn Đã xem/Đã gửi.
  const lastMineId = (() => {
    const list = messages ?? [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].sender?.id === me?.id && list[i].id > 0) return list[i].id;
    }
    return null;
  })();

  // Vào phòng là đánh dấu đã đọc.
  useEffect(() => {
    if (convId > 0) markRead.mutate(convId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId]);

  const onSend = () => {
    const content = text.trim();
    if (!content || send.isPending) return;
    setText('');
    // Ưu tiên gửi qua socket (realtime 2 chiều); socket chưa nối thì fallback REST.
    if (!realtime.send(content)) send.mutate(content);
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/messages'));

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text variant="subheading" numberOfLines={1} style={styles.nameText}>{conv?.partner_name ?? 'Tin nhắn'}</Text>
            {realtime.partnerOnline ? <View style={styles.onlineDot} /> : null}
          </View>
          {realtime.partnerOnline ? (
            <Text variant="caption" style={styles.presenceOn}>Đang hoạt động</Text>
          ) : conv?.product?.name ? (
            <Text variant="caption" numberOfLines={1} style={styles.headerProduct}>Về: {conv.product.name}</Text>
          ) : null}
        </View>
      </View>

      {/* Sản phẩm đang trao đổi */}
      {conv?.product ? (
        <Pressable
          style={styles.productBar}
          onPress={() => router.push({ pathname: '/products/[id]', params: { id: conv.product!.id } })}>
          <View style={styles.productThumb}>
            {mediaUrl(conv.product.image) ? (
              <Image source={mediaUrl(conv.product.image)} style={styles.productImg} contentFit="cover" />
            ) : null}
          </View>
          <Text variant="body" numberOfLines={1} style={styles.productName}>{conv.product.name}</Text>
          <Ionicons name="chevron-forward" size={16} color={Palette.inkFaint} />
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}>
        {isPending ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages ?? []}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyMsg}><Text variant="bodyMuted">Gửi lời chào để bắt đầu nhé.</Text></View>
            }
            renderItem={({ item }) => {
              const mine = item.sender?.id === me?.id;
              return (
                <Bubble
                  msg={item}
                  mine={mine}
                  receipt={mine && item.id === lastMineId ? (item.is_read ? 'seen' : 'sent') : undefined}
                />
              );
            }}
          />
        )}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhắn tin…"
            placeholderTextColor={Palette.inkFaint}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || send.isPending) && styles.sendOff]}
            onPress={onSend}
            disabled={!text.trim() || send.isPending}>
            <Ionicons name="send" size={18} color={Palette.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  flex: { flex: 1 },
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
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameText: { flexShrink: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.successFg },
  presenceOn: { color: Palette.successFg, fontFamily: Font.medium },
  headerProduct: { color: Palette.inkFaint },
  productBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  productThumb: { width: 36, height: 36, borderRadius: Radius.control, backgroundColor: Palette.surfaceSunken, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  productName: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { padding: 12, gap: 8 },
  emptyMsg: { alignItems: 'center', paddingVertical: 48 },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: Palette.brand, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Palette.white, borderWidth: 1, borderColor: Palette.line, borderBottomLeftRadius: 4 },
  msgText: { fontFamily: Font.regular, fontSize: 14.5, color: Palette.ink },
  msgTextMine: { color: Palette.white },
  msgTime: { fontFamily: Font.regular, fontSize: 10.5, color: Palette.inkFaint, marginTop: 3, alignSelf: 'flex-end' },
  msgTimeMine: { color: 'rgba(255,255,255,0.75)' },
  receipt: { fontFamily: Font.regular, fontSize: 11, color: Palette.inkFaint, alignSelf: 'flex-end', marginTop: 3, marginRight: 2 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    backgroundColor: Palette.white,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 40,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: Font.regular,
    fontSize: 14.5,
    color: Palette.ink,
    backgroundColor: Palette.white,
  },
  sendBtn: { width: 40, height: 40, borderRadius: Radius.control, backgroundColor: Palette.brand, alignItems: 'center', justifyContent: 'center' },
  sendOff: { backgroundColor: Palette.lineStrong },
});
