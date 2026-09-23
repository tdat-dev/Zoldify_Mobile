import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, Paginated } from '@/api';

export type NotificationType =
  | 'order_status'
  | 'review'
  | 'payment'
  | 'system'
  | 'message'
  | 'new_product';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

async function fetchNotifications(page: number, limit: number) {
  const res = await http.get<ApiResponse<Paginated<AppNotification>>>('/notifications', {
    params: { currentPage: page, limit },
  });
  return res.data.data;
}

/** Danh sách thông báo cuộn vô hạn (mới nhất trước). */
export function useNotifications(limit = 20) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) => fetchNotifications(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current < last.meta.pages ? last.meta.current + 1 : undefined,
  });
}

/** Số thông báo chưa đọc — cho badge trên tab. `enabled=false` cho khách (tránh 401). */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const res = await http.get<ApiResponse<{ unread_count: number }>>(
        '/notifications/unread-count',
      );
      return res.data.data.unread_count;
    },
    enabled,
    // Làm tươi định kỳ để badge phản ánh push mới cả khi không mở tab Thông báo.
    refetchInterval: enabled ? 30000 : false,
  });
}

/** Đăng ký token thiết bị (FCM) để nhận push. Gọi sau khi đăng nhập. */
export async function savePushToken(token: string, platform = 'android') {
  await http.post('/notifications/push-token', { token, platform });
}

/** Gỡ token khi đăng xuất để thiết bị thôi nhận push của user cũ. */
export async function removePushToken(token: string) {
  await http.delete('/notifications/push-token', { data: { token } });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await http.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await http.patch('/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
