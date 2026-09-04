import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import { tokenStore } from '@/lib/auth/token-store';
import type {
  ApiResponse,
  AuthUser,
  LoginResponse,
  LoginUserDto,
  MessageResponse,
  RegisterUserDto,
  SendRegisterOtpDto,
  VerifyRegisterOtpDto,
} from '@/api';

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

/** Hồ sơ đầy đủ trả về từ /auth/profile & PATCH (rộng hơn AuthUserDto sinh tự động). */
export interface ProfileUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone_number?: string | null;
  gender?: string | null;
  /** Đã có mật khẩu chưa (false = tài khoản Google/social, hiện "Đặt mật khẩu"). */
  has_password?: boolean;
}

export interface ProfileInput {
  full_name?: string;
  avatar?: string;
  phone_number?: string;
  gender?: string;
}

/** Lời gọi API auth ở dạng hàm — dùng khi cần gọi ngoài React (bootstrap...). */
export const authApi = {
  /** Đăng nhập rồi cất luôn token, nơi gọi không phải tự nhớ làm việc đó. */
  async login(dto: LoginUserDto): Promise<LoginResponse> {
    const res = await http.post<ApiResponse<LoginResponse>>('/auth/login', dto);
    const data = res.data.data;
    await tokenStore.save(data.access_token, data.refresh_token);
    return data;
  },

  async register(dto: RegisterUserDto): Promise<AuthUser> {
    const res = await http.post<ApiResponse<AuthUser>>('/auth/register', dto);
    return res.data.data;
  },

  /**
   * Đăng nhập/đăng ký bằng Google: gửi Firebase idToken (lấy sau khi Google
   * Sign-In → firebase signInWithCredential) cho backend. Backend verify token,
   * tự tạo tài khoản nếu chưa có, trả JWT như login thường. Cất token luôn.
   */
  async firebaseLogin(idToken: string): Promise<LoginResponse> {
    const res = await http.post<ApiResponse<LoginResponse>>('/auth/firebase', { idToken });
    const data = res.data.data;
    await tokenStore.save(data.access_token, data.refresh_token);
    return data;
  },

  /** Bước 1 đăng ký OTP: gửi mã xác thực về email. */
  async sendRegisterOtp(dto: SendRegisterOtpDto): Promise<void> {
    await http.post<ApiResponse<MessageResponse>>('/auth/register/send-otp', dto);
  },

  /**
   * Bước 2: xác thực mã + đặt mật khẩu. Backend tạo tài khoản tại đây.
   * Response chưa chắc trả token nên nơi gọi sẽ đăng nhập lại để lấy phiên.
   */
  async verifyRegisterOtp(dto: VerifyRegisterOtpDto): Promise<void> {
    await http.post<ApiResponse<MessageResponse>>('/auth/register/verify-otp', dto);
  },

  /** Quên mật khẩu — bước 1: gửi OTP về email. */
  async sendForgotPasswordOtp(email: string): Promise<void> {
    await http.post<ApiResponse<MessageResponse>>('/auth/forgot-password/send-otp', { email });
  },

  /** Quên mật khẩu — bước 2: xác thực OTP + đặt mật khẩu mới. */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await http.post<ApiResponse<MessageResponse>>('/auth/forgot-password/reset', {
      email,
      otp,
      newPassword,
    });
  },

  async profile(): Promise<ProfileUser> {
    const res = await http.get<ApiResponse<ProfileUser>>('/auth/profile');
    return res.data.data;
  },

  /** Tự cập nhật hồ sơ (tên/SĐT/giới tính/avatar) — PATCH /auth/profile. */
  async updateProfile(input: ProfileInput): Promise<ProfileUser> {
    const res = await http.patch<ApiResponse<ProfileUser>>('/auth/profile', input);
    return res.data.data;
  },

  /**
   * Đổi/ĐẶT mật khẩu (đang đăng nhập) — POST /auth/change-password.
   * `oldPassword` bỏ trống khi tài khoản social đặt mật khẩu lần đầu.
   *
   * BE thu hồi mọi phiên khác (tăng token_version) và cấp TOKEN MỚI cho phiên
   * này — phải lưu ngay, nếu không request kế tiếp sẽ mang token cũ (đã bị vô
   * hiệu) → chính mình bị đá ra.
   */
  async changePassword(oldPassword: string | undefined, newPassword: string): Promise<void> {
    const res = await http.post<ApiResponse<{ access_token?: string; refresh_token?: string }>>(
      '/auth/change-password',
      {
        ...(oldPassword ? { oldPassword } : {}),
        newPassword,
      },
    );
    const data = res.data.data;
    if (data?.access_token && data?.refresh_token) {
      await tokenStore.save(data.access_token, data.refresh_token);
    }
  },

  /**
   * Xoá token ở máy TRƯỚC, rồi mới báo server.
   * Nếu gọi server trước mà mạng rớt thì người dùng bấm đăng xuất xong
   * vẫn đang đăng nhập — trạng thái tệ nhất.
   */
  async logout(): Promise<void> {
    try {
      await http.post<ApiResponse<MessageResponse>>('/auth/logout');
    } finally {
      await tokenStore.clear();
    }
  },
};

/** Mutation đăng nhập, sẵn dùng trong màn hình. */
export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginUserDto) => authApi.login(dto),
  });
}

/** Mutation đăng ký (trực tiếp, không OTP). */
export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterUserDto) => authApi.register(dto),
  });
}

/** Gửi OTP đăng ký về email. */
export function useSendRegisterOtp() {
  return useMutation({
    mutationFn: (dto: SendRegisterOtpDto) => authApi.sendRegisterOtp(dto),
  });
}

/** Xác thực OTP đăng ký (tạo tài khoản). */
export function useVerifyRegisterOtp() {
  return useMutation({
    mutationFn: (dto: VerifyRegisterOtpDto) => authApi.verifyRegisterOtp(dto),
  });
}

/** Quên mật khẩu — gửi OTP. */
export function useSendForgotPasswordOtp() {
  return useMutation({
    mutationFn: (email: string) => authApi.sendForgotPasswordOtp(email),
  });
}

/** Quên mật khẩu — đặt lại mật khẩu bằng OTP. */
export function useResetPassword() {
  return useMutation({
    mutationFn: (v: { email: string; otp: string; newPassword: string }) =>
      authApi.resetPassword(v.email, v.otp, v.newPassword),
  });
}

/** Cập nhật hồ sơ của chính mình. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: ProfileInput) => authApi.updateProfile(input),
  });
}

/** Đổi/đặt mật khẩu. `oldPassword` bỏ trống khi đặt lần đầu (tài khoản social). */
export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { oldPassword?: string; newPassword: string }) =>
      authApi.changePassword(v.oldPassword, v.newPassword),
    // Đặt mật khẩu xong → has_password đổi → làm mới hồ sơ để menu cập nhật nhãn.
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.profile() }),
  });
}

/** Hồ sơ của chính mình (kèm has_password) — cho màn Đổi/Đặt mật khẩu. */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.profile(),
    enabled,
  });
}
