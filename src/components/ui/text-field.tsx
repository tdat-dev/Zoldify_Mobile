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
  secure?: boolean;
}

/** Ô nhập Zoldify: nhãn trên, viền hairline góc 4px, focus đổi brand. */
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
          placeholderTextColor={Palette.inkFaint}
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
  fieldError: { borderColor: Palette.dangerFg },
  input: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.ink,
    paddingVertical: 13,
  },
  toggle: { marginLeft: 12 },
  error: { color: Palette.dangerFg, marginTop: 6 },
});
