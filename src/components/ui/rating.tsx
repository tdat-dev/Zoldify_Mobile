import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { Palette } from './theme';

/**
 * Dải sao đánh giá (0–5, nửa sao). Primitive dùng lại cho review/hồ sơ người
 * bán KHI backend có dữ liệu rating. Không tự bịa điểm ở nơi gọi — chỉ hiển thị
 * `value` được truyền vào.
 */
export function RatingStars({
  value,
  size = 14,
  count,
  style,
}: {
  value: number;
  size?: number;
  /** Số lượt đánh giá, hiện trong ngoặc nếu có. */
  count?: number;
  style?: object;
}) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <View style={[styles.row, style]} accessibilityLabel={`${v.toFixed(1)} trên 5 sao`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const name = v >= i + 1 ? 'star' : v >= i + 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={i} name={name} size={size} color={Palette.pendingFg} />;
      })}
      <Text style={[styles.value, { fontSize: size - 1 }]}>
        {v.toFixed(1)}
        {count != null ? ` (${count})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  value: { fontFamily: 'BeVietnamPro_600SemiBold', color: Palette.inkMuted, marginLeft: 4 },
});
