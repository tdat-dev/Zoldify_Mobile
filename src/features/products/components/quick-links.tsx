import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';

/**
 * Hàng lối tắt — icon LINE phẳng (Feather) trong ô brand-tint, theo doctrine
 * "sổ kê": không dùng sprite 3D nhiều màu (đã bỏ — trông như clip-art). Mỗi ô
 * một hành động chính của chợ đồ cũ.
 */
const LINKS: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  href: string;
}[] = [
  { label: 'Đăng bán', icon: 'plus-circle', href: '/sell' },
  { label: 'Mới đăng', icon: 'zap', href: '/search' },
  { label: 'Dưới 100k', icon: 'tag', href: '/search' },
  { label: 'Đơn mua', icon: 'package', href: '/orders' },
  { label: 'Ví của tôi', icon: 'credit-card', href: '/account' },
  { label: 'Tin nhắn', icon: 'message-circle', href: '/messages' },
];

export function QuickLinks() {
  return (
    <View style={styles.card}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {LINKS.map((l) => (
          <Pressable
            key={l.label}
            style={styles.item}
            onPress={() => router.push(l.href as never)}
            accessibilityRole="button"
            accessibilityLabel={l.label}>
            <View style={styles.thumb}>
              <Feather name={l.icon} size={24} color={Palette.brand} />
            </View>
            <Text variant="caption" numberOfLines={1} style={styles.label}>
              {l.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surfaceCard,
    borderRadius: Radius.card,
    paddingVertical: 14,
    marginBottom: 12,
  },
  row: { gap: 4, paddingHorizontal: 8 },
  item: { width: 76, alignItems: 'center', gap: 7, paddingHorizontal: 2 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.control,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center', color: Palette.ink },
});
