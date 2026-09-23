import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { Palette } from './theme';

interface Props {
  children: ReactNode;
  /** Hiện nút quay lại (mũi tên trái). */
  onBack?: () => void;
  /** Hiện nút Huỷ (chữ, góc trái) — dùng cho luồng dạng modal. */
  onClose?: () => void;
  title?: string;
  /** Vùng dính đáy màn (thường là nút chính). */
  footer?: ReactNode;
  /** Cho phép cuộn nội dung. */
  scroll?: boolean;
  /**
   * Căn giữa dọc nội dung khi nó NGẮN hơn màn (form đăng nhập/đăng ký) — nội
   * dung dài thì tự cuộn từ trên. Chỉ có tác dụng khi scroll=true. Tránh cảnh
   * nội dung dồn lên đầu để lại khoảng trống chết ở nửa dưới.
   */
  center?: boolean;
}

/**
 * Khung màn hình chung: nền surface, an toàn tai thỏ, header tối giản
 * (quay lại / huỷ / tiêu đề) và vùng footer dính đáy cho nút chính.
 */
export function Screen({ children, onBack, onClose, title, footer, scroll, center }: Props) {
  const insets = useSafeAreaInsets();
  const hasHeader = !!onBack || !!onClose || !!title;
  const [footerHeight, setFooterHeight] = useState(0);

  // Android bật edge-to-edge nên cửa sổ KHÔNG tự co khi bàn phím mở — phải tự
  // né: màn cuộn thì cuộn ô đang nhập lên trên bàn phím (footer dính theo mép
  // trên bàn phím, nên chừa thêm chiều cao footer); màn tĩnh thì đệm đáy.
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior="padding"
      enabled={!scroll}>
      {hasHeader ? (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            {onBack ? (
              <Pressable hitSlop={12} onPress={onBack} accessibilityLabel="Quay lại">
                <View style={styles.chevron} />
              </Pressable>
            ) : onClose ? (
              <Pressable hitSlop={12} onPress={onClose}>
                <Text variant="link" style={{ color: Palette.inkMuted }}>
                  Huỷ
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text variant="label" numberOfLines={1} style={styles.headerTitle}>
            {title ?? ''}
          </Text>
          <View style={styles.headerSide} />
        </View>
      ) : null}

      {scroll ? (
        <KeyboardAwareScrollView
          bottomOffset={KEYBOARD_GAP + footerHeight}
          contentContainerStyle={[styles.content, center && styles.centerContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.content, styles.flex]}>{children}</View>
      )}

      {footer ? (
        <KeyboardStickyView enabled={!!scroll} offset={{ closed: 0, opened: insets.bottom }}>
          <View
            style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
            {footer}
          </View>
        </KeyboardStickyView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Khoảng hở giữa ô đang nhập và mép trên bàn phím. */
export const KEYBOARD_GAP = 24;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  flex: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerSide: { width: 60, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  chevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.ink,
    transform: [{ rotate: '45deg' }],
    marginLeft: 6,
  },
  content: { paddingHorizontal: 24, paddingVertical: 16 },
  centerContent: { flexGrow: 1, justifyContent: 'center' },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
});
