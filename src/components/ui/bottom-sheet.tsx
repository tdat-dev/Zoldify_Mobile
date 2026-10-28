import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Radius } from './theme';

/**
 * Bảng trượt từ đáy dùng chung (chọn tỉnh/quận/phường, danh mục, địa chỉ, lọc).
 *
 * VÌ SAO cần component riêng thay vì mỗi màn tự dựng `<Modal>`: Modal là một
 * cửa sổ riêng, và react-native-keyboard-controller ép cửa sổ đó về
 * SOFT_INPUT_ADJUST_NOTHING (giả lập edge-to-edge, xem ModalAttachedWatcher.kt).
 * Nghĩa là bàn phím mở lên KHÔNG đẩy gì cả. Lỗi thật 28/10: gõ "Lai" trong ô
 * "Tìm nhanh" của Tỉnh/Thành, danh sách lọc còn 1 dòng, bảng co thấp xuống đáy
 * và nằm gọn dưới bàn phím, phải tắt bàn phím mới bấm được.
 *
 * KeyboardAvoidingView của keyboard-controller nhận sự kiện bàn phím cả trong
 * Modal, đệm đáy đúng bằng chiều cao bàn phím. Bảng `flexShrink: 1` nên khi
 * danh sách dài nó co lại vừa phần còn trống phía trên bàn phím.
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
  return (
    <Modal visible={visible} transparent animationType={animationType} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }, style]}>{children}</View>
      </KeyboardAvoidingView>
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
