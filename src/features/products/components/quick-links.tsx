import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';

/**
 * Hàng lối tắt — mỗi hành động một ILLUSTRATION phẳng (sinh bằng wakermcp, đồng
 * bộ style: hình khối đậm, viền tối, bóng nhẹ, nền trắng). Giống quick-action
 * của Amazon (dùng minh hoạ, không phải icon vector trơn) nhưng tiết chế theo
 * doctrine phẳng. Ảnh bundle sẵn ở assets (160px, ~20KB/ảnh).
 */
const LINKS = [
  { label: 'Đăng bán', img: require('../../../../assets/images/ql-sell.png'), href: '/sell' },
  { label: 'Mới đăng', img: require('../../../../assets/images/ql-new.png'), href: '/search' },
  { label: 'Dưới 100k', img: require('../../../../assets/images/ql-deal.png'), href: '/search' },
  { label: 'Đơn mua', img: require('../../../../assets/images/ql-order.png'), href: '/orders' },
  { label: 'Ví của tôi', img: require('../../../../assets/images/ql-wallet.png'), href: '/account' },
  { label: 'Tin nhắn', img: require('../../../../assets/images/ql-chat.png'), href: '/messages' },
] as const;

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
              <Image source={l.img} style={styles.img} contentFit="contain" />
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
    width: 56,
    height: 56,
    borderRadius: Radius.control,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: 44, height: 44 },
  label: { textAlign: 'center', color: Palette.ink },
});
