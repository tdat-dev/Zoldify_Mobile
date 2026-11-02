import { create } from 'zustand';

import { authApi } from '@/features/auth/api';
import { disconnectChatSocket } from '@/features/chat/socket';
import { unregisterPushBeforeLogout } from '@/features/notifications/push';
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
  /** Tài khoản vừa bị xoá (token đã bỏ): về khách và bỏ dữ liệu của phiên. */
  accountDeleted: () => void;
  /** Lấy lại profile sau khi tự sửa hồ sơ, để UI phản ánh ngay. */
  refreshProfile: () => Promise<void>;
}

/**
 * Lúc mở app, splash native còn che màn cho tới khi biết đã đăng nhập chưa.
 * Mạng chậm thì lời gọi profile ăn trọn timeout 20 giây của client, splash
 * đứng theo (E2E 02/11 đo khoảng 8 giây, D-01). Chờ tối đa chừng này thôi.
 */
const HYDRATE_PROFILE_TIMEOUT_MS = 6000;

/** Có token thì lấy profile để chốt signedIn; hỏng thì coi như signedOut. */
async function resolveSession(timeoutMs?: number): Promise<{ status: AuthStatus; user: AuthUser | null }> {
  const token = await tokenStore.getAccessToken();
  if (!token) {
    return { status: 'signedOut', user: null };
  }
  try {
    const user = await authApi.profile(timeoutMs);
    return { status: 'signedIn', user };
  } catch (e) {
    // Token bị server từ chối (401) thì interceptor đã xoá. Còn mất mạng hay
    // hết giờ thì GIỮ token: lần mở sau có mạng là vào lại được, không bắt
    // đăng nhập lại chỉ vì lúc mở app đang ở chỗ sóng yếu.
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 401 || status === 403) await tokenStore.clear();
    return { status: 'signedOut', user: null };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'hydrating',
  user: null,

  hydrate: async () => {
    set(await resolveSession(HYDRATE_PROFILE_TIMEOUT_MS));
  },

  signIn: async () => {
    set(await resolveSession());
  },

  signOut: async () => {
    try {
      await unregisterPushBeforeLogout();
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

  accountDeleted: () => {
    disconnectChatSocket();
    set({ status: 'signedOut', user: null });
    queryClient.clear();
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
