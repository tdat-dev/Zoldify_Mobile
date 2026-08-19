import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

/**
 * Dải "an toàn" — thay cho banner sale của sàn hàng mới. Ở chợ đồ cũ, thứ cần
 * quảng bá là NIỀM TIN: kiểm hàng, giữ tiền (escrow), bán nhanh. Nội dung tĩnh,
 * thật của Zoldify — không bịa số liệu, không "sập sàn".
 */
const ITEMS: { icon: FeatherName; label: string; href?: string }[] = [
  { icon: 'shield', label: 'Kiểm hàng\nkhi nhận' },
  { icon: 'lock', label: 'Giữ tiền\nan toàn' },
  { icon: 'zap', label: 'Đăng bán\n30 giây', href: '/sell' },
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
          <Feather name={it.icon} size={20} color={Palette.brand} />
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
  label: {
    textAlign: 'center',
    fontFamily: Font.medium,
    fontSize: 12,
    color: Palette.ink,
    lineHeight: 16,
  },
});
