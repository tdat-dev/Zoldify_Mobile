import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, Paginated, Product } from '@/api';

export interface ChatMessage {
  id: number;
  content: string;
  images?: string[] | null;
  is_read: boolean;
  created_at: string;
  sender?: { id: number; full_name?: string; avatar?: string };
}

export interface Conversation {
  id: number;
  updated_at: string;
  product?: Product | null;
  partner_name?: string;
  partner_id?: number;
  partner_avatar?: string | null;
  last_message?: ChatMessage | null;
  unread_count: number;
}

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (id: number) => [...chatKeys.all, 'messages', id] as const,
  unread: () => [...chatKeys.all, 'unread'] as const,
};

/** Danh sách hội thoại (đã kèm tin cuối + số chưa đọc, mới cập nhật trước). */
export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: async () => {
      const res = await http.get<ApiResponse<{ result: Conversation[] }>>('/chat/conversations');
      return res.data.data.result;
    },
  });
}

/**
 * Tin nhắn của một hội thoại. BE trả mới-nhất-trước; ta đảo về cũ→mới để hiển
 * thị (tin mới ở đáy). Realtime chính đi qua socket (useChatRealtime); giữ poll
 * chậm 20s làm lưới an toàn phòng khi WebSocket rớt/bị chặn.
 */
export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<ChatMessage>>>(
        `/chat/conversations/${conversationId}/messages`,
        { params: { currentPage: 1, limit: 50 } },
      );
      return [...res.data.data.result].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    },
    enabled: Number.isFinite(conversationId) && conversationId > 0,
    refetchInterval: 20000,
  });
}

export function useSendMessage(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await http.post<ApiResponse<ChatMessage>>(
        `/chat/conversations/${conversationId}/messages`,
        { content },
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: number) => {
      await http.patch(`/chat/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      qc.invalidateQueries({ queryKey: chatKeys.unread() });
    },
  });
}

/** Mở/tạo hội thoại với người bán về một sản phẩm (nút "Nhắn người bán"). */
export function useStartConversation() {
  return useMutation({
    mutationFn: async (input: { seller_id: number; product_id: number }) => {
      const res = await http.post<ApiResponse<{ id: number }>>('/chat/conversations', input);
      return res.data.data;
    },
  });
}
