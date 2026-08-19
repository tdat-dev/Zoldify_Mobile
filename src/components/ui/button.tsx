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
  leading?: React.ReactNode;
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
              { color: variant === 'primary' ? Palette.white : variant === 'secondary' ? Palette.ink : Palette.brand },
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
  primaryDisabled: { backgroundColor: '#A9BEE2' },
  otherDisabled: { opacity: 0.5 },
  label: { fontFamily: Font.bold, fontSize: 15, lineHeight: 20 },
});
