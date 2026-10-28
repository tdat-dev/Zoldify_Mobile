import { Image, type ImageProps } from 'expo-image';
import type { ReactNode } from 'react';

import { useRemoteImage } from '@/hooks/use-remote-image';

/**
 * Ảnh lấy từ server: bản thu nhỏ khi `thumb`, lùi về ảnh gốc và tự tải lại khi
 * hỏng (xem `useRemoteImage`). Hỏng hẳn hoặc không có ảnh thì vẽ `fallback`.
 */
export function RemoteImage({
  path,
  thumb,
  fallback = null,
  onError,
  ...props
}: Omit<ImageProps, 'source'> & {
  path?: string | null;
  thumb?: boolean;
  fallback?: ReactNode;
}) {
  const img = useRemoteImage(path, { thumb });
  if (!img.uri) return <>{fallback}</>;
  return (
    <Image
      {...props}
      key={img.key}
      source={img.uri}
      onError={(e) => {
        img.onError();
        onError?.(e);
      }}
    />
  );
}
