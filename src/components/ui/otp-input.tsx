import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/**
 * Ô nhập OTP: một TextInput ẩn bắt phím, phía trên là các ô hiển thị từng
 * số. Chạm bất kỳ đâu để bật bàn phím số. Chỉ nhận chữ số.
 */
export function OtpInput({ value, onChange, length = 6, autoFocus }: Props) {
  const ref = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => ref.current?.focus()}>
      <View style={styles.row}>
        {Array.from({ length }).map((_, i) => {
          const char = value[i] ?? '';
          const active = i === value.length;
          return (
            <View
              key={i}
              style={[styles.box, char ? styles.filled : null, active ? styles.active : null]}>
              <Text style={styles.digit}>{char}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  box: {
    flex: 1,
    height: 58,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { borderColor: '#C7D5EE' },
  active: { borderColor: Palette.brand },
  digit: { fontFamily: Font.bold, fontSize: 22, color: Palette.ink },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
