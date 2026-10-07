import { create } from 'zustand';

import { kvStore } from '@/lib/kv-store';

/**
 * Danh sách "đã lưu" (wishlist) — hành vi lõi của mua đồ cũ mà app đang thiếu.
 * Lưu cục bộ theo thiết bị (kvStore) để bấm tim là thấy ngay, không chờ mạng;
 * đồng bộ lên server có thể thêm sau mà không đổi API của store này.
 *
 * MỖI TÀI KHOẢN MỘT KHOÁ (`zoldify.wishlist.u<id>`, khách: `.guest`). Trước đây
 * cả máy dùng chung một khoá `zoldify.wishlist`: đăng xuất rồi đăng nhập tài
 * khoản khác vẫn thấy nguyên danh sách của người trước (lỗi H-06 test E2E
 * 30/09). `_layout` gọi `setOwner` mỗi khi người đăng nhập đổi.
 *
 * Giữ id ở cả `ids` (mảng, cho UI render danh sách theo thứ tự thêm) và `set`
 * (tra cứu O(1) cho HeartButton). Ghi xuống kvStore mỗi lần đổi.
 */
const KEY_PREFIX = 'zoldify.wishlist';

/** Khoá dùng chung cũ: không biết của ai nên bỏ, không gán cho ai cả. */
const LEGACY_KEY = 'zoldify.wishlist';

/** null = khách chưa đăng nhập. */
type Owner = number | null;

function keyFor(owner: Owner): string {
  return owner == null ? `${KEY_PREFIX}.guest` : `${KEY_PREFIX}.u${owner}`;
}

interface WishlistState {
  /** undefined = chưa biết là ai (auth còn đang đọc phiên). */
  owner: Owner | undefined;
  ids: number[];
  set: Set<number>;
  hydrated: boolean;
  /** Đổi người sở hữu danh sách (đăng nhập/đăng xuất/đổi tài khoản). */
  setOwner: (owner: Owner) => Promise<void>;
  toggle: (id: number) => void;
  has: (id: number) => boolean;
  clear: () => void;
}

async function persist(owner: Owner, ids: number[]) {
  try {
    await kvStore.set(keyFor(owner), JSON.stringify(ids));
  } catch {
    // Lưu hỏng (hết chỗ/quyền) không được làm sập thao tác bấm tim.
  }
}

export const useWishlistStore = create<WishlistState>((setState, getState) => ({
  owner: undefined,
  ids: [],
  set: new Set(),
  hydrated: false,

  setOwner: async (owner) => {
    const cur = getState();
    if (cur.hydrated && cur.owner === owner) return;
    // Xoá ngay danh sách đang hiện, KHÔNG chờ đọc xong: nếu không, tim của
    // người trước còn sáng trong lúc đọc khoá của người sau.
    setState({ owner, ids: [], set: new Set(), hydrated: false });
    kvStore.remove(LEGACY_KEY).catch(() => {});

    let ids: number[] = [];
    try {
      const raw = await kvStore.get(keyFor(owner));
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      ids = Array.isArray(parsed) ? parsed.filter((x): x is number => typeof x === 'number') : [];
    } catch {
      ids = [];
    }
    // Đổi tài khoản lần nữa trong lúc đang đọc: kết quả này đã cũ, bỏ.
    if (getState().owner !== owner) return;
    setState({ ids, set: new Set(ids), hydrated: true });
  },

  toggle: (id) => {
    const { set, owner } = getState();
    if (owner === undefined) return; // chưa biết ai: không ghi nhầm khoá.
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = [...next];
    setState({ set: next, ids });
    void persist(owner, ids);
  },

  has: (id) => getState().set.has(id),

  clear: () => {
    const { owner } = getState();
    setState({ ids: [], set: new Set() });
    if (owner !== undefined) void persist(owner, []);
  },
}));
