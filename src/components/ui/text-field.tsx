import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

/**
 * Trên web/Safari, <input> có outline focus mặc định (cam/xanh) đè lên viền
 * brand của mình → viền đôi lệch, nhìn linh tinh. Tắt outline để chỉ còn viền
 * của TextField. Native (iOS/Android) không có outline nên vô hại.
 */
const webInputReset =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  /** Dòng gợi ý luôn hiện dưới ô (vd "Tối thiểu 6 ký tự"), khác error. */
  hint?: string;
  /** Đã hợp lệ: viền xanh + dấu ✓ để trấn an (email đúng, mật khẩu khớp). */
  valid?: boolean;
  secure?: boolean;
}

/**
 * Ô nhập Zoldify: nhãn trên, viền hairline góc 4px, focus đổi brand.
 * forwardRef để màn hình nối returnKey (Email → Mật khẩu) bằng ref.focus().
 */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, hint, valid, secure, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const showValid = valid && !error;

  return (
    <View>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          showValid && styles.fieldValid,
          !!error && styles.fieldError,
        ]}>
        <TextInput
          ref={ref}
          style={[styles.input, webInputReset, style]}
          placeholderTextColor={Palette.inkFaint}
          secureTextEntry={secure ? hidden : false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {showValid ? (
          <Ionicons name="checkmark-circle" size={18} color={Palette.successFg} style={styles.check} />
        ) : null}

        {secure ? (
          <Pressable
            hitSlop={12}
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}>
            <Text variant="link" style={styles.toggle}>
              {hidden ? 'Hiện' : 'Ẩn'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
    paddingHorizontal: 14,
  },
  fieldFocused: { borderColor: Palette.brand },
  fieldValid: { borderColor: Palette.successFg },
  fieldError: { borderColor: Palette.dangerFg },
  input: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.ink,
    paddingVertical: 13,
  },
  check: { marginLeft: 8 },
  toggle: { marginLeft: 12 },
  error: { color: Palette.dangerFg, marginTop: 6 },
  hint: { color: Palette.inkMuted, marginTop: 6 },
});
