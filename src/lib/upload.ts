import { Platform } from 'react-native';

import http from '@/lib/api/client';
import type { ApiResponse } from '@/api';

/**
 * Tải một ảnh lên backend rồi trả URL đã lưu.
 *
 * Backend: POST /files/upload (cần đăng nhập), field `fileUpload`, header
 * `folder_type`. Trả về bản ghi file có `url`.
 *
 * RN gửi file dạng { uri, name, type }; web phải lấy blob thật từ uri.
 */
export async function uploadImage(uri: string, folder = 'products'): Promise<string> {
  const name = uri.split('/').pop()?.split('?')[0] || `photo-${Date.now()}.jpg`;
  const ext = (name.split('.').pop() || 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('fileUpload', blob, name);
  } else {
    // RN: object file — KHÔNG dùng Blob.
    form.append('fileUpload', { uri, name, type } as any);
  }

  const res = await http.post<ApiResponse<{ url: string }>>('/files/upload', form, {
    // Không đặt Content-Type: để axios/tự trình duyệt gắn boundary đúng.
    headers: { folder_type: folder },
  });
  return res.data.data.url;
}
