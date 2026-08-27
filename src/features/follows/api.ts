import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, Paginated } from '@/api';

/** Người bán trong danh sách đang theo dõi (map từ User entity của BE). */
export interface FollowedUser {
  id: number;
  full_name?: string;
  avatar?: string | null;
  created_at?: string;
}

/**
 * Theo dõi người bán (BE module `follows`).
 *   POST /follows/toggle {following_id}   -> {followed}
 *   GET  /follows/check/:sellerId          -> {followed}   (cần đăng nhập)
 *   GET  /follows/:sellerId/count          -> {follower, following}  (công khai)
 */
export const followKeys = {
  status: (sellerId: number) => ['follows', 'status', sellerId] as const,
  count: (sellerId: number) => ['follows', 'count', sellerId] as const,
  following: (userId: number) => ['follows', 'following', userId] as const,
};

/** Danh sách shop mà `userId` đang theo dõi (trang 1). */
export function useFollowing(userId?: number) {
  return useQuery({
    queryKey: followKeys.following(userId ?? 0),
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<FollowedUser>>>(`/follows/${userId}/following`);
      return res.data.data.result;
    },
    enabled: Number.isFinite(userId) && (userId ?? 0) > 0,
  });
}

/** Đang theo dõi seller này chưa? Chỉ chạy khi đã đăng nhập + có sellerId. */
export function useFollowStatus(sellerId: number, enabled = true) {
  return useQuery({
    queryKey: followKeys.status(sellerId),
    queryFn: async () => {
      const res = await http.get<ApiResponse<{ followed: boolean }>>(`/follows/check/${sellerId}`);
      return res.data.data.followed;
    },
    enabled: enabled && Number.isFinite(sellerId) && sellerId > 0,
  });
}

/** Số người theo dõi / đang theo dõi của seller (công khai). */
export function useFollowCount(sellerId: number) {
  return useQuery({
    queryKey: followKeys.count(sellerId),
    queryFn: async () => {
      const res = await http.get<ApiResponse<{ follower: number; following: number }>>(
        `/follows/${sellerId}/count`,
      );
      return res.data.data;
    },
    enabled: Number.isFinite(sellerId) && sellerId > 0,
  });
}

/** Bật/tắt theo dõi. Cập nhật lạc quan trạng thái + số follower. */
export function useToggleFollow(sellerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await http.post<ApiResponse<{ followed: boolean }>>('/follows/toggle', {
        following_id: sellerId,
      });
      return res.data.data.followed;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: followKeys.status(sellerId) });
      const prev = qc.getQueryData<boolean>(followKeys.status(sellerId)) ?? false;
      const next = !prev;
      qc.setQueryData(followKeys.status(sellerId), next);
      qc.setQueryData<{ follower: number; following: number }>(followKeys.count(sellerId), (c) =>
        c ? { ...c, follower: Math.max(0, c.follower + (next ? 1 : -1)) } : c,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(followKeys.status(sellerId), ctx.prev);
      qc.invalidateQueries({ queryKey: followKeys.count(sellerId) });
    },
    onSettled: (followed) => {
      if (typeof followed === 'boolean') qc.setQueryData(followKeys.status(sellerId), followed);
      qc.invalidateQueries({ queryKey: followKeys.count(sellerId) });
    },
  });
}
