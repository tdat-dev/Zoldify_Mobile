import { create } from 'zustand';

import { authApi } from '@/features/auth/api';
import { disconnectChatSocket } from '@/features/chat/socket';
import { unregisterPushBeforeLogout } from '@/features/notifications/push';
import { queryClient } from '@/lib/api/query-client';
import { resetSessionCache } from '@/lib/api/session';
import { tokenStore } from '@/lib/auth/token-store';
import type { AuthUser } from '@/api';

/**
 * Trạng thái phiên đăng nhập — nguồn sự thật DUY NHẤT cho việc app đang
 * đăng nhập hay chưa. Điều hướng (route-group / auth-gate) chỉ đọc `status`
 * từ đây, không tự đoán bằng cách hỏi SecureStore rải rác.
 *
 *   hydrating   -> đang đọc token lúc mở app, CHƯA biết. Giữ splash ở đây.
 *   signedIn    -> có token hợp lệ, đã lấy được profile.
 *   unverified  -> CÓ token nhưng chưa kiểm tra lại được (mất mạng, hết giờ,
 *                  server lỗi). Không phải khách: đừng mời đăng nhập, cứ chờ
 *                  có mạng rồi hydrate lại.
 *   signedOut   -> không có token, hoặc server từ chối (401/403).
 *
 * `user` luôn lấy từ GET /auth/profile (một nguồn), nên không phụ thuộc
 * hình dạng của response đăng nhập.
 */
export type AuthStatus = 'hydrating' | 'signedIn' | 'unverified' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;

  /**
   * Đọc token, xác thực bằng cách lấy profile. Gọi lúc mở app và mỗi lần
   * có mạng trở lại khi trạng thái còn `unverified`.
   */
  hydrate: () => Promise<void>;
  /** Gọi sau khi đăng nhập thành công (token đã được authApi.login lưu). */
  signIn: () => Promise<void>;
  /** Người dùng chủ động đăng xuất: báo server rồi xoá phiên. */
  signOut: () => Promise<void>;
  /**
   * Server từ chối phiên đang mở (interceptor 401 đã xoá token). Trả true nếu
   * thật sự vừa mất phiên, để nơi gọi báo cho người dùng.
   */
  sessionExpired: () => boolean;
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

/** Có token thì lấy profile để chốt signedIn; server từ chối mới là signedOut. */
async function resolveSession(timeoutMs?: number): Promise<{ status: AuthStatus; user: AuthUser | null }> {
  const token = await tokenStore.getAccessToken();
  if (!token) {
    return { status: 'signedOut', user: null };
  }
  try {
    const user = await authApi.profile(timeoutMs);
    return { status: 'signedIn', user };
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 401 || status === 403) {
      // Token bị server từ chối thì interceptor đã xoá — hết phiên thật.
      await tokenStore.clear();
      return { status: 'signedOut', user: null };
    }
    // Mất mạng / hết giờ / 5xx: chưa có bằng chứng nào nói phiên hết. GIỮ token,
    // báo `unverified` thay vì signedOut — nếu không, mở app ở chỗ sóng yếu là
    // tab "Tôi" mời đăng nhập nhầm, và có mạng lại vẫn đứng im cho tới khi
    // tắt-mở app (mới hydrate lại một lần lúc mở).
    return { status: 'unverified', user: null };
  }
}

/** Đang đăng xuất: 401 của lệnh gỡ push/logout không phải là "hết phiên". */
let signingOut = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'hydrating',
  user: null,

  hydrate: async () => {
    set(await resolveSession(HYDRATE_PROFILE_TIMEOUT_MS));
  },

  signIn: async () => {
    set(await resolveSession());
  },

  signOut: async () => {
    signingOut = true;
    try {
      await unregisterPushBeforeLogout();
      await authApi.logout();
    } finally {
      signingOut = false;
      disconnectChatSocket();
      set({ status: 'signedOut', user: null });
      // Bỏ mọi dữ liệu của phiên cũ (đơn, đã đánh giá, số thông báo...). Không
      // xoá thì truy vấn bị tắt vẫn trả bản cũ: khách thấy số chưa đọc của người
      // vừa thoát, người đăng nhập sau thoáng thấy dữ liệu người trước.
      // Xoá SAU khi đổi trạng thái để màn đang mở không tải lại bằng phiên cũ.
      resetSessionCache(queryClient);
    }
  },

  sessionExpired: () => {
    // hydrating thì hydrate tự chốt xong đã; signedOut thì chẳng còn gì dọn.
    // unverified mà bị 401 nghĩa là token đã thật sự hết hạn — dọn như signedIn.
    if (signingOut) return false;
    const status = get().status;
    if (status !== 'signedIn' && status !== 'unverified') return false;
    disconnectChatSocket();
    set({ status: 'signedOut', user: null });
    resetSessionCache(queryClient);
    return true;
  },

  accountDeleted: () => {
    disconnectChatSocket();
    set({ status: 'signedOut', user: null });
    resetSessionCache(queryClient);
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
