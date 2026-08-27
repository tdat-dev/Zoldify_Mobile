import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useCategories } from '@/features/categories/api';

/**
 * Dải chip danh mục cuộn ngang — mỗi chip có icon dẫn đầu (map theo tên) để
 * dễ quét mắt, không còn là pill chữ trơn. Giữ phẳng 4px + hairline. Danh mục
 * động từ BE (đồ cũ lẫn mới) nên map theo TỪ KHOÁ, thiếu thì icon mặc định.
 */
function iconFor(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('nấu') || n.includes('bếp') || n.includes('gia dụng')) return 'restaurant';
  if (n.includes('thể thao') || n.includes('bóng')) return 'football';
  if (n.includes('quần') || n.includes('áo') || n.includes('thời trang')) return 'shirt';
  if (n.includes('điện thoại') || n.includes('phone')) return 'phone-portrait';
  if (n.includes('laptop') || n.includes('máy tính')) return 'laptop';
  if (n.includes('tablet') || n.includes('máy tính bảng')) return 'tablet-portrait';
  if (n.includes('tai nghe') || n.includes('âm thanh')) return 'headset';
  if (n.includes('đồng hồ') || n.includes('watch')) return 'watch';
  if (n.includes('phụ kiện')) return 'glasses';
  if (n.includes('sách') || n.includes('văn phòng')) return 'book';
  if (n.includes('mẹ') || n.includes('bé') || n.includes('trẻ')) return 'happy';
  if (n.includes('làm đẹp') || n.includes('mỹ phẩm')) return 'sparkles';
  return 'pricetag';
}

export function CategoryChips() {
  const { data } = useCategories();
  if (!data || data.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.wrap}>
      {data.map((c) => (
        <Pressable
          key={c.id}
          style={styles.chip}
          onPress={() =>
            router.push({ pathname: '/category/[id]', params: { id: c.id, name: c.name } })
          }>
          <View style={styles.iconWrap}>
            <Ionicons name={iconFor(c.name)} size={14} color={Palette.brand} />
          </View>
          <Text style={styles.chipText} numberOfLines={1}>
            {c.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: { gap: 8, paddingHorizontal: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.surfaceCard,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: Radius.control,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.ink },
});
