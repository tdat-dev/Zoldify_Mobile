import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';

/** Dải "hoặc" ngăn giữa nút Google và form email. */
export function OrDivider({ label = 'hoặc' }: { label?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: Palette.lineStrong },
  label: { color: Palette.inkMuted },
});
