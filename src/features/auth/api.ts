import { useMutation } from '@tanstack/react-query';

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

  async profile(): Promise<AuthUser> {
    const res = await http.get<ApiResponse<AuthUser>>('/auth/profile');
    return res.data.data;
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
