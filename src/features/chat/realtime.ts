import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { type Socket } from 'socket.io-client';

import { useAuthStore } from '@/features/auth/store';
import { chatKeys, type ChatMessage } from '@/features/chat/api';
import { connectChatSocket, getChatSocket } from '@/features/chat/socket';

/**
 * Realtime cho chat qua socket.io (namespace /chat). BE broadcast
 * `receive_message` tới mọi người trong phòng `conv_<id>` khi có tin mới (kể cả
 * tin của chính mình sau khi lưu). Ta join/leave phòng theo màn đang mở và ghi
 * thẳng vào cache react-query để tin hiện tức thì — thay cho poll 5s.
 */

/** Sắp xếp cũ→mới để tin mới nằm đáy (khớp useMessages). */
function sortByTime(list: ChatMessage[]) {
  return [...list].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

/**
 * Bật realtime cho một hội thoại: join phòng + nghe `receive_message`. Trả về
 * `send` gửi tin qua socket (lạc quan: hiện ngay tin tạm, khi server broadcast
 * về thì thay bằng bản thật). Nếu socket chưa nối được thì `send` trả false để
 * caller fallback sang REST.
 */
export function useChatRealtime(conversationId: number, partnerId?: number) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [partnerOnline, setPartnerOnline] = useState(false);

  useEffect(() => {
    if (!(conversationId > 0)) return;
    let sock: Socket | null = null;
    let cancelled = false;

    const onReceive = (msg: ChatMessage) => {
      qc.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (prev) => {
        const list = prev ?? [];
        if (list.some((m) => m.id === msg.id)) return list; // đã có -> bỏ qua
        // gỡ tin tạm (id âm) cùng nội dung của cùng người gửi
        const cleaned = list.filter(
          (m) => !(m.id < 0 && m.content === msg.content && m.sender?.id === msg.sender?.id),
        );
        return sortByTime([...cleaned, msg]);
      });
      // cập nhật danh sách hội thoại (tin cuối / chưa đọc)
      qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    };

    // Hiện diện đối phương: snapshot lúc vào + cập nhật theo sự kiện online/offline.
    const onSnapshot = (p: { user_ids: number[] }) => {
      if (partnerId) setPartnerOnline(p.user_ids.includes(partnerId));
    };
    const onPresence = (p: { user_id: number; online: boolean }) => {
      if (partnerId && p.user_id === partnerId) setPartnerOnline(p.online);
    };

    connectChatSocket().then((s) => {
      if (cancelled || !s) return;
      sock = s;
      s.emit('join_conversation', conversationId);
      s.emit('request_online_users');
      s.on('receive_message', onReceive);
      s.on('online_users_snapshot', onSnapshot);
      s.on('user_presence', onPresence);
    });

    return () => {
      cancelled = true;
      if (sock) {
        sock.emit('leave_conversation', conversationId);
        sock.off('receive_message', onReceive);
        sock.off('online_users_snapshot', onSnapshot);
        sock.off('user_presence', onPresence);
      }
    };
  }, [conversationId, partnerId, qc]);

  /** Gửi qua socket + hiện lạc quan. Trả false nếu socket chưa sẵn sàng. */
  const send = useCallback(
    (content: string): boolean => {
      const sock = getChatSocket();
      if (!sock?.connected || !me) return false;
      const temp: ChatMessage = {
        id: -Date.now(),
        content,
        images: null,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: { id: me.id },
      };
      qc.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (prev) =>
        sortByTime([...(prev ?? []), temp]),
      );
      sock.emit('send_message', { conversationId, content });
      return true;
    },
    [conversationId, me, qc],
  );

  return { send, partnerOnline };
}
