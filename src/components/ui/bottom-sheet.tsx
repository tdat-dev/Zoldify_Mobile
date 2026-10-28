import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardController, KeyboardEvents } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Radius } from './theme';

/** Chờ bàn phím đóng tối đa chừng này (ms); sự kiện lỡ mất thì vẫn đi tiếp. */
const DISMISS_WAIT = 350;

/**
 * Đóng bàn phím rồi mới làm `fn` (thường là đóng bảng).
 *
 * Đóng Modal trong lúc bàn phím còn mở là hai chuyển động chồng nhau trên hai
 * cửa sổ khác nhau; sự kiện "bàn phím đã ẩn" khi đó có thể rơi mất và bảng mở
 * kế tiếp tưởng bàn phím vẫn còn (xem BottomSheet). Có hạn chờ để không bao
 * giờ kẹt nút đóng nếu sự kiện không tới.
 */
export async function dismissKeyboardThen(fn: () => void): Promise<void> {
  if (KeyboardController.isVisible()) {
    await Promise.race([
      KeyboardController.dismiss(),
      new Promise((r) => setTimeout(r, DISMISS_WAIT)),
    ]);
  }
  fn();
}

/**
 * Bảng trượt từ đáy dùng chung (chọn tỉnh/quận/phường, danh mục, địa chỉ, lọc).
 *
 * Modal là cửa sổ riêng, react-native-keyboard-controller ép nó về
 * SOFT_INPUT_ADJUST_NOTHING (ModalAttachedWatcher.kt): bàn phím mở lên KHÔNG đẩy
 * gì. Hai lỗi thật đã gặp:
 *  1. 28/10: gõ tìm tỉnh còn 1 dòng, bảng co xuống đáy nằm dưới bàn phím.
 *  2. 28/10 trên máy thật: chọn quận khi bàn phím đang mở, bảng Phường mở ra
 *     bị đẩy lơ lửng giữa màn với khoảng xám trống bên dưới, phải mở rồi tắt
 *     bàn phím một lần mới hết. KeyboardAvoidingView giữ chiều cao bàn phím CŨ
 *     vì sự kiện ẩn rơi mất lúc Modal trước đóng.
 * Nên ở đây tự giữ khoảng đệm: mở bảng thì về 0 (mở Modal luôn làm bàn phím
 * ẩn), chỉ tăng khi CHÍNH bảng này nhận sự kiện bàn phím hiện, về 0 khi ẩn. Mọi
 * lối đóng đều cất bàn phím trước (dismissKeyboardThen).
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  style,
  animationType = 'slide',
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Ghi đè kiểu của bảng (maxHeight, padding...). */
  style?: StyleProp<ViewStyle>;
  animationType?: 'slide' | 'fade' | 'none';
}) {
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setKeyboard(0);
    const subs = [
      KeyboardEvents.addListener('keyboardWillShow', (e) => setKeyboard(e.height)),
      KeyboardEvents.addListener('keyboardDidShow', (e) => setKeyboard(e.height)),
      KeyboardEvents.addListener('keyboardWillHide', () => setKeyboard(0)),
      KeyboardEvents.addListener('keyboardDidHide', () => setKeyboard(0)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [visible]);

  const close = () => dismissKeyboardThen(onClose);

  return (
    <Modal visible={visible} transparent animationType={animationType} onRequestClose={close}>
      <View style={[styles.root, { paddingBottom: keyboard }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: keyboard > 0 ? 8 : insets.bottom + 8 }, style]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(25,32,41,0.4)' },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    maxHeight: '80%',
    flexShrink: 1,
  },
});
