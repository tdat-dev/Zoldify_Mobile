import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from './theme';

/**
 * Nút quay lại hình mũi ‹ — gộp lại một chỗ vì trước đây mỗi màn tự vẽ chevron
 * bằng View xoay 45° (dễ lệch pixel giữa các màn). `tone` chọn màu theo nền:
 * 'dark' cho header brand, 'light' cho nền sáng.
 */
export function BackChevron({
  onPress,
  tone = 'light',
  style,
}: {
  onPress: () => void;
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}) {
  const color = tone === 'dark' ? Palette.white : Palette.ink;
  return (
    <Pressable
      style={[styles.hit, style]}
      hitSlop={8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Quay lại">
      <View style={[styles.chevron, { borderColor: color }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { width: 34, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  chevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
});
