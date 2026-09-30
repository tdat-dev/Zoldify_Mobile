import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import http from '@/lib/api/client';
import type { ApiResponse } from '@/api';

/**
 * Cạnh dài tối đa của ảnh gửi lên, và chất lượng JPEG.
 *
 * Ảnh camera điện thoại thường 3-8MB (4000px trở lên). Gửi nguyên ảnh gốc với
 * timeout 20s của client chung thì trên máy ảo, ảnh PNG 1.17MB đã không kịp:
 * app báo "Đăng bán chưa được" và request không bao giờ tới server (lỗi H-03,
 * test E2E 30/09); ảnh 17KB thì đăng trong 5 giây. 1600px vẫn nét trên mọi màn
 * hình điện thoại và gallery chi tiết, còn dung lượng xuống cỡ 150-400KB.
 */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;

/** Upload vẫn chậm hơn request thường nhiều trên 4G yếu: cho riêng 60s. */
const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * Thu nhỏ + nén ảnh trước khi upload. Ảnh đã nhỏ hơn MAX_SIDE thì chỉ nén lại
 * sang JPEG, không phóng to. Hỏng (định dạng lạ, thiếu quyền đọc) thì trả null
 * để nơi gọi gửi ảnh gốc: nén là tối ưu, không được làm hỏng việc đăng bán.
 */
async function shrinkForUpload(uri: string): Promise<string | null> {
  try {
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    const context = ImageManipulator.manipulate(original);
    if (Math.max(original.width, original.height) > MAX_SIDE) {
      context.resize(
        original.width >= original.height ? { width: MAX_SIDE } : { height: MAX_SIDE },
      );
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
    return saved.uri;
  } catch {
    return null;
  }
}

/**
 * Tải một ảnh lên backend rồi trả URL đã lưu.
 *
 * Backend: POST /files/upload (cần đăng nhập), field `fileUpload`, header
 * `folder_type`. Trả về bản ghi file có `url`.
 *
 * RN gửi file dạng { uri, name, type }; web phải lấy blob thật từ uri.
 */
export async function uploadImage(uri: string, folder = 'products'): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const name = uri.split('/').pop()?.split('?')[0] || `photo-${Date.now()}.jpg`;
    const blob = await (await fetch(uri)).blob();
    form.append('fileUpload', blob, name);
  } else {
    const shrunk = await shrinkForUpload(uri);
    const fileUri = shrunk ?? uri;
    const name = shrunk
      ? `photo-${Date.now()}.jpg`
      : uri.split('/').pop()?.split('?')[0] || `photo-${Date.now()}.jpg`;
    const ext = (name.split('.').pop() || 'jpg').toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    // RN: object file, KHÔNG dùng Blob.
    form.append('fileUpload', { uri: fileUri, name, type } as any);
  }

  const res = await http.post<ApiResponse<{ url: string }>>('/files/upload', form, {
    // Không đặt Content-Type: để axios/tự trình duyệt gắn boundary đúng.
    headers: { folder_type: folder },
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return res.data.data.url;
}
