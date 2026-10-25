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

/** Chờ server xác nhận tin quá lâu thì coi là gửi hỏng. */
const SEND_ACK_TIMEOUT_MS = 10_000;

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
    // Server từ chối tin (hết quyền, hội thoại không tồn tại...) thì chỉ phát
    // `error`, không broadcast gì: tin tạm đang chờ phải chuyển sang hỏng.
    const onServerError = () => {
      qc.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (prev) =>
        prev?.map((m) => (m.localStatus === 'sending' ? { ...m, localStatus: 'failed' } : m)),
      );
    };

    connectChatSocket().then((s) => {
      if (cancelled || !s) return;
      sock = s;
      s.emit('join_conversation', conversationId);
      s.emit('request_online_users');
      s.on('receive_message', onReceive);
      s.on('online_users_snapshot', onSnapshot);
      s.on('user_presence', onPresence);
      s.on('error', onServerError);
    });

    return () => {
      cancelled = true;
      if (sock) {
        sock.emit('leave_conversation', conversationId);
        sock.off('receive_message', onReceive);
        sock.off('online_users_snapshot', onSnapshot);
        sock.off('user_presence', onPresence);
        sock.off('error', onServerError);
      }
    };
  }, [conversationId, partnerId, qc]);

  /**
   * Gửi qua socket + hiện lạc quan. Trả false nếu socket chưa sẵn sàng.
   * Server trả tin đã lưu qua ack; quá hạn không có ack (server từ chối thì
   * không ack) thì tin tạm chuyển sang 'failed' để người dùng gửi lại.
   */
  const send = useCallback(
    (content: string): boolean => {
      const sock = getChatSocket();
      if (!sock?.connected || !me) return false;
      const key = chatKeys.messages(conversationId);
      const temp: ChatMessage = {
        id: -Date.now(),
        content,
        images: null,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: { id: me.id },
        localStatus: 'sending',
      };
      qc.setQueryData<ChatMessage[]>(key, (prev) => sortByTime([...(prev ?? []), temp]));
      sock
        .timeout(SEND_ACK_TIMEOUT_MS)
        .emit('send_message', { conversationId, content }, (err: unknown, saved?: ChatMessage) => {
          qc.setQueryData<ChatMessage[]>(key, (prev) => {
            const list = prev ?? [];
            if (err || !saved?.id) {
              return list.map((m) => (m.id === temp.id ? { ...m, localStatus: 'failed' } : m));
            }
            // Thay tin tạm bằng tin thật (receive_message có thể đã thêm trước).
            const rest = list.filter((m) => m.id !== temp.id && m.id !== saved.id);
            return sortByTime([...rest, saved]);
          });
        });
      return true;
    },
    [conversationId, me, qc],
  );

  /** Bỏ một tin tạm (trước khi gửi lại nó). */
  const discard = useCallback(
    (tempId: number) => {
      qc.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (prev) =>
        prev?.filter((m) => m.id !== tempId),
      );
    },
    [conversationId, qc],
  );

  return { send, discard, partnerOnline };
}
