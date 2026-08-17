import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  /** Hiện nút ẩn/hiện với ô mật khẩu. */
  secure?: boolean;
}

/**
 * Ô nhập chuẩn Zoldify: nhãn trên, viền dịu, đổi xanh brand khi focus, chữ
 * lỗi đỏ ở dưới. Ô mật khẩu có nút hiện/ẩn.
 */
export function TextField({ label, error, secure, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

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
          !!error && styles.fieldError,
        ]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Palette.muted}
          secureTextEntry={secure ? hidden : false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {secure ? (
          <Pressable hitSlop={10} onPress={() => setHidden((v) => !v)}>
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
  },
  fieldFocused: { borderColor: Palette.brand, backgroundColor: Palette.white },
  fieldError: { borderColor: Palette.danger },
  input: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 16,
    color: Palette.ink,
    paddingVertical: 14,
  },
  toggle: { marginLeft: 12 },
  error: { color: Palette.danger, marginTop: 6 },
});
