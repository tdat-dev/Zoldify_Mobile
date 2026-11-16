import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Gọi một lần khi vừa gõ đủ số, nhận luôn mã (state cha chưa kịp cập nhật). */
  onComplete?: (code: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/**
 * Chờ màn chuyển xong mới focus. Focus ngay lúc mount (prop autoFocus) thì
 * Android có khi giữ bàn phím chữ của màn trước, nhất là sau hộp thoại "lưu
 * mật khẩu" của Google, nên người dùng thấy bàn phím chữ thay vì bàn phím số.
 */
const FOCUS_DELAY_MS = 350;

/**
 * Ô nhập OTP: một TextInput ẩn bắt phím, phía trên là các ô hiển thị từng
 * số. Chạm bất kỳ đâu để bật bàn phím số. Chỉ nhận chữ số.
 */
export function OtpInput({ value, onChange, onComplete, length = 6, autoFocus }: Props) {
  const ref = useRef<TextInput>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => ref.current?.focus(), FOCUS_DELAY_MS);
    return () => clearTimeout(t);
  }, [autoFocus]);

  // Ô ẩn đã focus mà bàn phím bị tắt (bấm Back) thì focus() lần nữa không
  // làm gì trên Android, chạm ô không mở lại được. Blur rồi focus lại để
  // bàn phím số luôn hiện.
  const openKeyboard = () => {
    const input = ref.current;
    if (!input) return;
    if (input.isFocused()) {
      input.blur();
      requestAnimationFrame(() => ref.current?.focus());
    } else {
      input.focus();
    }
  };

  const handleChange = (t: string) => {
    const code = t.replace(/\D/g, '').slice(0, length);
    onChange(code);
    if (code.length === length && value.length < length) onComplete?.(code);
  };

  return (
    <Pressable onPress={openKeyboard}>
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
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="one-time-code"
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
