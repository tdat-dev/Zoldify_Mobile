import { create } from 'zustand';

import { authApi } from '@/features/auth/api';
import { disconnectChatSocket } from '@/features/chat/socket';
import { queryClient } from '@/lib/api/query-client';
import { tokenStore } from '@/lib/auth/token-store';
import type { AuthUser } from '@/api';

/**
 * Trạng thái phiên đăng nhập — nguồn sự thật DUY NHẤT cho việc app đang
 * đăng nhập hay chưa. Điều hướng (route-group / auth-gate) chỉ đọc `status`
 * từ đây, không tự đoán bằng cách hỏi SecureStore rải rác.
 *
 *   hydrating -> đang đọc token lúc mở app, CHƯA biết. Giữ splash ở đây.
 *   signedIn  -> có token hợp lệ, đã lấy được profile.
 *   signedOut -> không có token, hoặc token hỏng/hết hạn.
 *
 * `user` luôn lấy từ GET /auth/profile (một nguồn), nên không phụ thuộc
 * hình dạng của response đăng nhập.
 */
export type AuthStatus = 'hydrating' | 'signedIn' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;

  /** Gọi một lần lúc mở app: đọc token, xác thực bằng cách lấy profile. */
  hydrate: () => Promise<void>;
  /** Gọi sau khi đăng nhập thành công (token đã được authApi.login lưu). */
  signIn: () => Promise<void>;
  /** Người dùng chủ động đăng xuất: báo server rồi xoá phiên. */
  signOut: () => Promise<void>;
  /** Phiên hết hạn (interceptor 401 đã xoá token) — chỉ cập nhật state. */
  sessionExpired: () => void;
  /** Lấy lại profile sau khi tự sửa hồ sơ, để UI phản ánh ngay. */
  refreshProfile: () => Promise<void>;
}

/** Có token thì lấy profile để chốt signedIn; hỏng thì coi như signedOut. */
async function resolveSession(): Promise<{ status: AuthStatus; user: AuthUser | null }> {
  const token = await tokenStore.getAccessToken();
  if (!token) {
    return { status: 'signedOut', user: null };
  }
  try {
    const user = await authApi.profile();
    return { status: 'signedIn', user };
  } catch {
    // Token có nhưng gọi profile hỏng (hết hạn/thu hồi). Interceptor 401
    // đã lo xoá token; ở đây chỉ cần kết luận là chưa đăng nhập.
    await tokenStore.clear();
    return { status: 'signedOut', user: null };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'hydrating',
  user: null,

  hydrate: async () => {
    set(await resolveSession());
  },

  signIn: async () => {
    set(await resolveSession());
  },

  signOut: async () => {
    try {
      await authApi.logout();
    } finally {
      disconnectChatSocket();
      set({ status: 'signedOut', user: null });
      // Bỏ mọi dữ liệu của phiên cũ (đơn, đã đánh giá, số thông báo...). Không
      // xoá thì truy vấn bị tắt vẫn trả bản cũ: khách thấy số chưa đọc của người
      // vừa thoát, người đăng nhập sau thoáng thấy dữ liệu người trước.
      // Xoá SAU khi đổi trạng thái để màn đang mở không tải lại bằng phiên cũ.
      queryClient.clear();
    }
  },

  sessionExpired: () => {
    disconnectChatSocket();
    set({ status: 'signedOut', user: null });
  },

  refreshProfile: async () => {
    try {
      const user = await authApi.profile();
      set({ user });
    } catch {
      // Lấy lại hồ sơ hỏng không đổi trạng thái đăng nhập — giữ user cũ.
    }
  },
}));
