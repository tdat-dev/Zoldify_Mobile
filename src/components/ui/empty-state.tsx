import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';
import { Palette } from './theme';

/**
 * Trạng thái rỗng dùng chung: icon trong vòng tròn nhạt + tiêu đề + phụ đề +
 * hành động (tuỳ chọn). Theo pattern app lớn (eBay/Shell/Deliveroo trên Mobbin)
 * — không để màn trơ một dòng chữ. Giữ doctrine phẳng: vòng tròn chỉ là nền
 * icon, control vẫn góc 4px.
 */
export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={26} color={Palette.inkMuted} />
      </View>
      <Text variant="heading" style={styles.title}>{title}</Text>
      {subtitle ? <Text variant="bodyMuted" style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 6 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 20 },
  action: { marginTop: 14, alignSelf: 'stretch', paddingHorizontal: 8 },
});
