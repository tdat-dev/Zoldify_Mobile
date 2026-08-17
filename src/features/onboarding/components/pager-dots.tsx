import { StyleSheet, View } from 'react-native';

import { Palette } from '@/components/ui/theme';

/** Chấm phân trang: chấm đang xem kéo dài màu brand, còn lại nhỏ xám. */
export function PagerDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === index ? styles.active : styles.inactive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 7, borderRadius: 999 },
  active: { width: 22, backgroundColor: Palette.brand },
  inactive: { width: 7, backgroundColor: Palette.line },
});
