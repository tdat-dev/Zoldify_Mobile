import http from '@/lib/http';
import { tokenStore } from '@/lib/token-store';
import type {
  ApiResponse,
  AuthUser,
  LoginResponse,
  LoginUserDto,
  MessageResponse,
  RegisterUserDto,
} from '@/api';

export const authService = {
  /** Đăng nhập rồi cất luôn token, nơi gọi không phải tự nhớ làm việc đó. */
  async login(dto: LoginUserDto): Promise<LoginResponse> {
    const res = await http.post<ApiResponse<LoginResponse>>('/auth/login', dto);
    const data = res.data.data;
    await tokenStore.save(data.access_token, data.refresh_token);
    return data;
  },

  async register(dto: RegisterUserDto) {
    const res = await http.post<ApiResponse<AuthUser>>('/auth/register', dto);
    return res.data.data;
  },

  async profile() {
    const res = await http.get<ApiResponse<AuthUser>>('/auth/profile');
    return res.data.data;
  },

  /**
   * Xoá token ở máy TRƯỚC, rồi mới báo server.
   * Nếu gọi server trước mà mạng rớt thì người dùng bấm đăng xuất xong
   * vẫn đang đăng nhập — trạng thái tệ nhất.
   */
  async logout() {
    try {
      await http.post<ApiResponse<MessageResponse>>('/auth/logout');
    } finally {
      await tokenStore.clear();
    }
  },
};
