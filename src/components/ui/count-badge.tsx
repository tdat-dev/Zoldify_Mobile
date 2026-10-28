import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Font, Palette } from './theme';

/**
 * Chấm đếm số (giỏ hàng, tin nhắn, thông báo, số bộ lọc), số nằm ĐÚNG tâm.
 *
 * Trước đây mỗi chỗ tự vẽ, chữ đi qua `<Text>` của ui nên kế thừa lineHeight 22
 * của variant body trong một chấm cao 16-17px; cộng thêm Be Vietnam Pro có
 * phần trên cao (chừa chỗ dấu tiếng Việt) và Android chèn font padding, số bị
 * đẩy lệch khỏi tâm (28/10, giỏ hàng trang chủ). Ở đây: lineHeight bằng đúng
 * chiều cao chấm, tắt includeFontPadding, căn dọc giữa.
 */
export function CountBadge({
  count,
  size = 17,
  color = Palette.price,
  ring = false,
  max = 99,
  style,
}: {
  count: number;
  /** Đường kính chấm (px). */
  size?: number;
  color?: string;
  /** Viền trắng tách chấm khỏi nền (dùng trên tab bar). */
  ring?: boolean;
  max?: number;
  /** Vị trí (position/top/right...) do chỗ dùng quyết định. */
  style?: StyleProp<ViewStyle>;
}) {
  if (!count || count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);
  const border = ring ? 1.5 : 0;
  const fontSize = Math.round(size * 0.6 * 2) / 2;
  return (
    <View
      style={[
        styles.badge,
        {
          minWidth: size,
          height: size,
          borderRadius: size / 2,
          paddingHorizontal: label.length > 1 ? 4 : 0,
          backgroundColor: color,
          borderWidth: border,
        },
        style,
      ]}>
      <Text
        allowFontScaling={false}
        style={[styles.text, { fontSize, lineHeight: size - border * 2 }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Palette.white,
  },
  text: {
    fontFamily: Font.bold,
    color: Palette.white,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
});
