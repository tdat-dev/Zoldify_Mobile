import { create } from 'zustand';

import { kvStore } from '@/lib/kv-store';

/**
 * Danh sách "đã lưu" (wishlist) — hành vi lõi của mua đồ cũ mà app đang thiếu.
 * Lưu cục bộ theo thiết bị (kvStore) để bấm tim là thấy ngay, không chờ mạng;
 * đồng bộ lên server có thể thêm sau mà không đổi API của store này.
 *
 * Giữ id ở cả `ids` (mảng, cho UI render danh sách theo thứ tự thêm) và `set`
 * (tra cứu O(1) cho HeartButton). Ghi xuống kvStore mỗi lần đổi.
 */
const KEY = 'zoldify.wishlist';

interface WishlistState {
  ids: number[];
  set: Set<number>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (id: number) => void;
  has: (id: number) => boolean;
  clear: () => void;
}

async function persist(ids: number[]) {
  try {
    await kvStore.set(KEY, JSON.stringify(ids));
  } catch {
    // Lưu hỏng (hết chỗ/quyền) không được làm sập thao tác bấm tim.
  }
}

export const useWishlistStore = create<WishlistState>((setState, getState) => ({
  ids: [],
  set: new Set(),
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await kvStore.get(KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];
      setState({ ids, set: new Set(ids), hydrated: true });
    } catch {
      setState({ ids: [], set: new Set(), hydrated: true });
    }
  },

  toggle: (id) => {
    const { set } = getState();
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = [...next];
    setState({ set: next, ids });
    void persist(ids);
  },

  has: (id) => getState().set.has(id),

  clear: () => {
    setState({ ids: [], set: new Set() });
    void persist([]);
  },
}));
