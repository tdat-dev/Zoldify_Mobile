import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';

/**
 * Dải "an toàn" — thứ cần quảng bá của SÀN là NIỀM TIN: kiểm hàng khi nhận,
 * giữ tiền (escrow), đăng bán nhanh. Dùng illustration phẳng cùng bộ với
 * QuickLinks (sinh bằng wakermcp). Nội dung tĩnh, thật — không bịa số liệu.
 * Sàn bán CẢ đồ cũ lẫn mới nên copy giữ trung tính.
 */
const ITEMS: { img: number; label: string; href?: string }[] = [
  { img: require('../../../../assets/images/tr-check.png'), label: 'Kiểm hàng\nkhi nhận' },
  { img: require('../../../../assets/images/tr-escrow.png'), label: 'Giữ tiền\nan toàn' },
  { img: require('../../../../assets/images/tr-fast.png'), label: 'Đăng bán\n30 giây', href: '/sell' },
];

export function TrustStrip() {
  return (
    <View style={styles.card}>
      {ITEMS.map((it, i) => (
        <Pressable
          key={it.label}
          style={[styles.col, i > 0 && styles.divider]}
          disabled={!it.href}
          onPress={() => it.href && router.push(it.href as never)}>
          <Image source={it.img} style={styles.icon} contentFit="contain" />
          <Text style={styles.label}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceCard,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    marginHorizontal: 12,
    marginBottom: 14,
    paddingVertical: 12,
  },
  col: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 6 },
  divider: { borderLeftWidth: 1, borderLeftColor: Palette.line },
  icon: { width: 34, height: 34 },
  label: {
    textAlign: 'center',
    fontFamily: Font.medium,
    fontSize: 12,
    color: Palette.ink,
    lineHeight: 16,
  },
});
