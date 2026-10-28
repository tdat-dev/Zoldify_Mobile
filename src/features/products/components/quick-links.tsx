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
  { label: 'Mới đăng', img: require('../../../../assets/images/ql-new.png'), href: { pathname: '/browse', params: { name: 'Mới đăng', sort: 'newest' } } },
  { label: 'Dưới 100k', img: require('../../../../assets/images/ql-deal.png'), href: { pathname: '/browse', params: { name: 'Dưới 100k', price_max: '100000' } } },
  { label: 'Đơn mua', img: require('../../../../assets/images/ql-order.png'), href: '/orders' },
  { label: 'Ví của tôi', img: require('../../../../assets/images/ql-wallet.png'), href: '/wallet' },
  { label: 'Tin nhắn', img: require('../../../../assets/images/ql-chat.png'), href: '/messages' },
] as const;
// Mới đăng / Dưới 100k mở thẳng danh sách đã lọc (/browse), không mở màn tìm
// kiếm trống; Ví mở màn ví thật (trước trỏ /account, không có gì về ví). 28/10.

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
  // Không khung: minh hoạ đã có viền và khối riêng, thêm ô viền quanh nó chỉ
  // làm hàng lối tắt trông như lưới nút (theo yêu cầu 28/10).
  thumb: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: 52, height: 52 },
  label: { textAlign: 'center', color: Palette.ink },
});
