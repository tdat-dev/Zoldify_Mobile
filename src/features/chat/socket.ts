import { io, type Socket } from 'socket.io-client';

import { tokenStore } from '@/lib/auth/token-store';
import { SOCKET_URL } from '@/lib/config';

/**
 * Socket.io dùng chung cho chat (namespace /chat của backend). Một kết nối duy
 * nhất cho toàn app; các màn join/leave phòng theo hội thoại. Tách riêng khỏi
 * store/hook để không tạo vòng import (auth store gọi disconnect khi đăng xuất).
 */
let socket: Socket | null = null;

/** Lấy (hoặc tạo) socket /chat đã xác thực. Idempotent. */
export async function connectChatSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  const token = await tokenStore.getAccessToken();
  if (!token) return null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      // Bắt đầu bằng long-polling rồi tự nâng cấp lên WebSocket. Cloudflare
      // (api.zoldify.com) chặn handshake WS-only → phải cho polling để nối được.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 8,
    });
  } else {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

/** Socket hiện tại (có thể null/chưa nối). */
export function getChatSocket(): Socket | null {
  return socket;
}

/** Ngắt & xoá socket (gọi khi đăng xuất). */
export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}
