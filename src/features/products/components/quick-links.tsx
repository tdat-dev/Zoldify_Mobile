import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';

/**
 * Hàng lối tắt icon — port từ web (components/home/QuickLinks.tsx). Web cắt
 * một sprite 3×2 (768×512) thành 6 ô; ở đây bê nguyên ảnh đó, đặt trong khung
 * 64×64 cắt bằng overflow + offset để giữ đúng hình minh hoạ, đúng thương hiệu.
 *
 * Các đích chưa có màn riêng (đơn mua/ví/tin nhắn) tạm dẫn về Tài khoản (khách
 * sẽ thấy cổng đăng nhập) — thay bằng route thật khi các màn đó xong.
 */
const CELL = 64; // cạnh mỗi ô hiển thị
const SPRITE = require('../../../../assets/images/quick-links.png');

const LINKS = [
  { label: 'Đăng bán', col: 0, row: 0, href: '/sell' },
  { label: 'Mới đăng', col: 1, row: 0, href: '/search' },
  { label: 'Dưới 100k', col: 2, row: 0, href: '/search' },
  { label: 'Đơn mua', col: 0, row: 1, href: '/account' },
  { label: 'Ví của tôi', col: 1, row: 1, href: '/account' },
  { label: 'Tin nhắn', col: 2, row: 1, href: '/account' },
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
            onPress={() => router.push(l.href as never)}>
            <View style={styles.thumb}>
              <Image
                source={SPRITE}
                style={[styles.sprite, { left: l.col * -CELL, top: l.row * -CELL }]}
                contentFit="fill"
              />
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
  row: { gap: 2, paddingHorizontal: 6 },
  item: { width: 84, alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  thumb: {
    width: CELL,
    height: CELL,
    borderRadius: Radius.control,
    overflow: 'hidden',
  },
  sprite: { position: 'absolute', width: CELL * 3, height: CELL * 2 },
  label: { textAlign: 'center', color: Palette.ink },
});
