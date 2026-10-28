import { useCallback, useEffect, useRef, useState } from 'react';

import { mediaUrl, thumbUrl } from '@/lib/media';

/** Chờ trước mỗi lần tải lại ảnh gốc đã hỏng (ms). Hết danh sách thì thôi. */
const RETRY_DELAYS = [1500, 4000];

/**
 * Nguồn ảnh có đường lùi và tải lại, cho expo-image.
 *
 * Trước đây ảnh hỏng một lần là ô trống mãi: máy ảo 28/10 có 32 ảnh bị đứt
 * giữa chừng (okhttp `StreamResetException: PROTOCOL_ERROR`) và trang chủ
 * trống trơn cho tới khi mở lại app, dù mạng đã thông. Thứ tự thử:
 *   1. bản thu nhỏ `_480.webp` (khi `thumb`),
 *   2. ảnh gốc (ảnh cũ chưa có bản nhỏ thì bước 1 là 404),
 *   3. ảnh gốc thêm 2 lần, cách 1,5 s rồi 4 s,
 * rồi mới báo `failed` để component vẽ ô dự phòng.
 *
 * `key` phải gắn vào `<Image key={key}>`: cùng một URL thì expo-image không tải
 * lại, đổi key buộc nó dựng lại và tải lần nữa.
 */
export function useRemoteImage(path?: string | null, opts?: { thumb?: boolean }) {
  const full = mediaUrl(path);
  const small = opts?.thumb ? thumbUrl(path) : full;
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đổi ảnh (cuộn danh sách tái dùng ô) thì bắt đầu lại từ đầu.
  useEffect(() => {
    setStep(0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [path]);

  const hasSmall = !!small && small !== full;
  // step 0: bản nhỏ (nếu có), các bước sau: ảnh gốc.
  const firstFull = hasSmall ? 1 : 0;
  const retries = step - firstFull;
  const failed = !full || retries > RETRY_DELAYS.length;
  const uri = failed ? undefined : step < firstFull ? small : full;

  const onError = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    // Lỗi ở bản nhỏ: sang ảnh gốc ngay, không chờ.
    if (step < firstFull) {
      setStep(firstFull);
      return;
    }
    const wait = RETRY_DELAYS[step - firstFull];
    if (wait === undefined) {
      setStep((s) => s + 1);
      return;
    }
    timer.current = setTimeout(() => setStep((s) => s + 1), wait);
  }, [step, firstFull]);

  return { uri, key: `${path ?? ''}#${step}`, failed, onError };
}
