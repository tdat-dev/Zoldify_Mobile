import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';

/**
 * Hàng lối tắt — mỗi hành động MỘT màu tiết chế riêng + icon FILLED (không phải
 * outline đơn sắc trông "basic/AI", cũng không phải sprite 3D loè loẹt). Màu có
 * nghĩa: đỏ = deal, amber = mới, xanh lá = đơn, tím = tin nhắn… Theo pattern
 * quick-action của Amazon/Shopee nhưng nền tint nhạt, giữ tinh thần phẳng.
 */
const LINKS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  href: string;
}[] = [
  { label: 'Đăng bán', icon: 'pricetag', color: Palette.brand, tint: '#E7EEFA', href: '/sell' },
  { label: 'Mới đăng', icon: 'flash', color: '#E08A00', tint: '#FBF0DC', href: '/search' },
  { label: 'Dưới 100k', icon: 'pricetags', color: Palette.price, tint: '#FBE4E4', href: '/search' },
  { label: 'Đơn mua', icon: 'cube', color: '#127A3E', tint: '#DEF3E6', href: '/orders' },
  { label: 'Ví của tôi', icon: 'wallet', color: '#0E8E9B', tint: '#DBF1F3', href: '/account' },
  { label: 'Tin nhắn', icon: 'chatbubble-ellipses', color: '#6A50D8', tint: '#E9E4FB', href: '/messages' },
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
            <View style={[styles.thumb, { backgroundColor: l.tint }]}>
              <Ionicons name={l.icon} size={23} color={l.color} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center', color: Palette.ink },
});
