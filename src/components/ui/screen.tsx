import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
}

/**
 * Khung màn hình chung: nền surface, an toàn tai thỏ, header tối giản
 * (quay lại / huỷ / tiêu đề) và vùng footer dính đáy cho nút chính.
 */
export function Screen({ children, onBack, onClose, title, footer, scroll }: Props) {
  const insets = useSafeAreaInsets();
  const hasHeader = !!onBack || !!onClose || !!title;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {hasHeader ? (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            {onBack ? (
              <Pressable hitSlop={12} onPress={onBack} accessibilityLabel="Quay lại">
                <View style={styles.chevron} />
              </Pressable>
            ) : onClose ? (
              <Pressable hitSlop={12} onPress={onClose}>
                <Text variant="link" style={{ color: Palette.muted }}>
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex]}>{children}</View>
      )}

      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surface },
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
  content: { paddingHorizontal: 24 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
});
