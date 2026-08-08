import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { tokenStore } from './token-store';

/**
 * Client HTTP dùng chung cho toàn app.
 *
 * Mọi response của backend đều bị TransformInterceptor bọc trong
 * { statusCode, message, data } — kiểu ApiResponse<T> trong src/api.
 * Nên chỗ dùng phải đọc `res.data.data`, không phải `res.data`.
 */
const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Cho phép màn hình đăng nhập đăng ký một hàm xử lý khi phiên hết hạn,
 * thay vì file này tự đi điều hướng. Tầng mạng không nên biết gì về router.
 */
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(handler: () => void) {
  onSessionExpired = handler;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // CHƯA CÓ REFRESH TOKEN.
      //
      // Backend trả refresh_token lúc đăng nhập và có sẵn cột
      // refresh_token + token_version trên bảng users, NHƯNG chưa có route
      // POST /auth/refresh để đổi lấy access token mới. Kiểm ngày 08/08:
      // openapi.json không có endpoint nào như vậy.
      //
      // Access token mặc định sống 1 ngày (JWT_ACCESS_EXPIRE), nên hiện
      // người dùng bị đăng xuất mỗi ngày một lần — khó chịu chứ không
      // chặn. Khi backend thêm route refresh thì sửa đúng chỗ này: gọi
      // refresh, gom các request đồng thời vào MỘT lần gọi (single-flight),
      // rồi chạy lại request cũ. Không có single-flight thì lúc mở app
      // 20 request song song sẽ bắn 20 lệnh refresh, và vì backend tăng
      // token_version mỗi lần nên 19 cái sau sẽ vô hiệu hoá cái đầu.
      await tokenStore.clear();
      onSessionExpired?.();
    }
    return Promise.reject(error);
  },
);

export default http;
