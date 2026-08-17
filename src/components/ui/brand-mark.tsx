import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

/**
 * Dấu hiệu thương hiệu Zoldify: ô bo tròn màu brand với chữ Z trắng.
 * Tối giản, dễ nhớ, không cần file ảnh.
 */
export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.32 },
      ]}>
      <Text
        style={{
          fontFamily: Font.extrabold,
          fontSize: size * 0.52,
          color: Palette.white,
          marginTop: -size * 0.03,
        }}>
        Z
      </Text>
    </View>
  );
}

/** Mark + chữ "Zoldify" nằm ngang. */
export function Wordmark({ size = 40 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <BrandMark size={size} />
      <Text style={[styles.word, { fontSize: size * 0.62 }]}>Zoldify</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  word: {
    fontFamily: Font.extrabold,
    color: Palette.ink,
    letterSpacing: -0.5,
  },
});
