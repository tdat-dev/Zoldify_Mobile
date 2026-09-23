import { create } from 'zustand';

import { kvStore } from '@/lib/kv-store';
import type { MockReview } from '@/features/reviews/mock';

/**
 * Đánh giá do CHÍNH người dùng gửi sau khi nhận hàng — lưu cục bộ theo thiết bị
 * (BE chưa có endpoint review). Gộp lên đầu danh sách review giả lập để "đánh giá
 * xong thấy ngay". Khi có BE thật thì thay bằng POST /reviews.
 */
const KEY = 'zoldify.myreviews';

interface StoredReview extends MockReview {
  productId: number;
}

interface ReviewState {
  byProduct: Record<number, StoredReview[]>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (productId: number, review: Omit<StoredReview, 'productId' | 'id' | 'mine'>) => void;
  reviewsFor: (productId: number) => StoredReview[];
  hasReviewed: (productId: number) => boolean;
}

async function persist(byProduct: Record<number, StoredReview[]>) {
  try {
    await kvStore.set(KEY, JSON.stringify(byProduct));
  } catch {
    // Lưu hỏng không được làm sập thao tác gửi đánh giá.
  }
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  byProduct: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await kvStore.get(KEY);
      set({ byProduct: raw ? JSON.parse(raw) : {}, hydrated: true });
    } catch {
      set({ byProduct: {}, hydrated: true });
    }
  },

  add: (productId, review) => {
    const { byProduct } = get();
    const list = byProduct[productId] ?? [];
    const entry: StoredReview = {
      ...review,
      productId,
      id: Date.now(),
      mine: true,
    };
    const next = { ...byProduct, [productId]: [entry, ...list] };
    set({ byProduct: next });
    void persist(next);
  },

  reviewsFor: (productId) => get().byProduct[productId] ?? [],
  hasReviewed: (productId) => (get().byProduct[productId]?.length ?? 0) > 0,
}));
