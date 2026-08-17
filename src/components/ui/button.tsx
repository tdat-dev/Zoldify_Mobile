import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  /** Icon nhỏ đặt trước nhãn (không bắt buộc). */
  leading?: React.ReactNode;
}

/**
 * Nút chuẩn Zoldify. Cao 52, bo tròn, chữ đậm. Ba cấp độ nhấn mạnh:
 * primary (xanh brand), secondary (viền), ghost (chỉ chữ).
 */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  leading,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && variant === 'primary' && styles.primaryDisabled,
        isDisabled && variant !== 'primary' && styles.otherDisabled,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Palette.white : Palette.brand} />
      ) : (
        <View style={styles.row}>
          {leading}
          <Text
            style={[
              styles.label,
              variant === 'primary' ? styles.labelOnBrand : styles.labelBrandOrInk,
              variant === 'secondary' && { color: Palette.ink },
            ]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: { backgroundColor: Palette.brand },
  secondary: { backgroundColor: Palette.white, borderWidth: 1, borderColor: Palette.line },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  primaryDisabled: { backgroundColor: '#AFC2E6' },
  otherDisabled: { opacity: 0.5 },
  label: { fontFamily: Font.bold, fontSize: 16, lineHeight: 20 },
  labelOnBrand: { color: Palette.white },
  labelBrandOrInk: { color: Palette.brand },
});
