import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useRemoteImage } from '@/hooks/use-remote-image';
import { Text } from './text';
import { Font, Palette } from './theme';

/** Hai chữ cái đầu (họ + tên) làm ảnh dự phòng khi không có avatar. */
function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

/**
 * Avatar tròn — ảnh thật (mediaUrl) hoặc dự phòng chữ cái trên nền brand.
 * Tròn là ngoại lệ có tiền lệ trong app (account avatar, FAB) — doctrine phẳng
 * chỉ cấm pill cho nút/thẻ, không cấm avatar/badge.
 */
export function Avatar({
  name,
  uri,
  size = 40,
  style,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  // Ảnh Google/R2 hỏng giữa chừng thì tải lại 2 lần rồi mới về chữ cái
  // (trước đây hỏng một lần là chữ cái mãi, xem useRemoteImage).
  const img = useRemoteImage(uri);
  const showImage = !!img.uri;
  const dims = { width: size, height: size, borderRadius: size / 2 };

  if (showImage) {
    return (
      <Image
        key={img.key}
        source={img.uri}
        style={[dims, style as object]}
        contentFit="cover"
        transition={140}
        onError={img.onError}
        accessibilityLabel={name ?? undefined}
      />
    );
  }

  return (
    <View style={[styles.fallback, dims, style]}>
      <Text style={[styles.text, { fontSize: Math.round(size * 0.4) }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: Palette.brand, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: Font.bold, color: Palette.white },
});
