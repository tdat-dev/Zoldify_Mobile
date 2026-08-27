import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  leading?: React.ReactNode;
  /** Style bọc ngoài (vd marginTop cho nút inline). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Nút Zoldify — phẳng, góc 4px (không pill). primary (brand đặc), secondary
 * (viền hairline), ghost (chỉ chữ).
 */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  leading,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  // Nút primary lúc "chưa bấm được" (form trống): nền xám đặc + chữ mờ, đọc rõ
  // là "tắt" — KHÔNG dùng brand-nhạt + chữ trắng (contrast ~1.6:1, trông như
  // đang loading/hỏng). Lúc loading để spinner brand trên nền xám = "đang chạy".
  const labelColor =
    variant === 'primary'
      ? isDisabled
        ? Palette.inkFaint
        : Palette.white
      : variant === 'secondary'
        ? Palette.ink
        : Palette.brand;
  const spinnerColor = variant === 'primary' && !isDisabled ? Palette.white : Palette.brand;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      // Style TĨNH (mảng), KHÔNG dùng hàm ({pressed})=>[]: với React Compiler
      // bật (app.json), style dạng hàm trên Pressable native bị bỏ qua → nút
      // biến thành chữ trơn canh trái. Mảng tĩnh render đúng như TextField.
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && variant === 'primary' && styles.primaryDisabled,
        isDisabled && variant !== 'primary' && styles.otherDisabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.row}>
          {leading}
          <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: { backgroundColor: Palette.brand },
  secondary: { backgroundColor: Palette.white, borderWidth: 1, borderColor: Palette.lineStrong },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.88 },
  primaryDisabled: { backgroundColor: Palette.surfaceSunken },
  otherDisabled: { opacity: 0.5 },
  label: { fontFamily: Font.bold, fontSize: 15, lineHeight: 20 },
});
