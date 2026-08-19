import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useCategories } from '@/features/categories/api';

/**
 * Dải chip danh mục cuộn ngang — thay cho lưới danh mục đã bỏ. Gọn, phẳng 4px,
 * hairline (không pill tròn). Bấm -> danh sách theo danh mục.
 */
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
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.surfaceCard,
  },
  chipText: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.ink },
});
