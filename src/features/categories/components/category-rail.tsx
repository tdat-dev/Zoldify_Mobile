import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';
import { useCategories } from '@/features/categories/api';
import { mediaUrl } from '@/lib/media';

/** Dải danh mục cuộn ngang trên trang chủ. Bấm -> danh sách theo danh mục. */
export function CategoryRail() {
  const { data } = useCategories();
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="heading" style={styles.title}>Danh mục</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {data.map((c) => (
          <Pressable
            key={c.id}
            style={styles.tile}
            onPress={() =>
              router.push({ pathname: '/category/[id]', params: { id: c.id, name: c.name } })
            }>
            <View style={styles.thumb}>
              <Image source={mediaUrl(c.image)} style={styles.thumbImg} contentFit="cover" />
            </View>
            <Text variant="caption" numberOfLines={2} style={styles.name}>
              {c.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  title: { marginBottom: 10 },
  row: { gap: 14, paddingRight: 4 },
  tile: { width: 64, alignItems: 'center', gap: 6 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.control,
    backgroundColor: Palette.brandTint,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  name: { textAlign: 'center', color: Palette.ink },
});
