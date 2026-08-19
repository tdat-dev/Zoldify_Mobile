import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useCategories, type Category } from '@/features/categories/api';
import { mediaUrl } from '@/lib/media';

/**
 * Lưới danh mục 3 cột — port khối "DANH MỤC" của web (home/CategoryTiles.tsx):
 * khối trắng, tiêu đề viết hoa mảnh, các ô đều nhau ngăn bằng hairline; mỗi ô
 * là hình tròn (ảnh danh mục hoặc CHỮ CÁI ĐẦU khi chưa có ảnh — không để ô xám
 * rỗng) + tên + số món.
 */
/** Một ô danh mục — ảnh thiếu/hỏng thì rơi về chữ cái đầu (không để ô trống). */
function CategoryCell({ c }: { c: Category }) {
  const uri = mediaUrl(c.image);
  const [failed, setFailed] = useState(false);
  const count = Number(c.product_count);
  const initial = (c.name ?? '?').trim().charAt(0).toUpperCase();

  return (
    <Pressable
      style={styles.cell}
      onPress={() =>
        router.push({ pathname: '/category/[id]', params: { id: c.id, name: c.name } })
      }>
      <View style={styles.thumb}>
        {uri && !failed ? (
          <Image
            source={uri}
            style={styles.thumbImg}
            contentFit="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={styles.initial}>{initial}</Text>
        )}
      </View>
      <Text variant="caption" numberOfLines={2} style={styles.name}>
        {c.name}
      </Text>
      {Number.isFinite(count) && count > 0 ? (
        <Text style={styles.count}>{count} món</Text>
      ) : null}
    </Pressable>
  );
}

export function CategoryTiles() {
  const { data } = useCategories();
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>DANH MỤC</Text>
      <View style={styles.grid}>
        {data.map((c) => (
          <CategoryCell key={c.id} c={c} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surfaceCard,
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.semibold,
    fontSize: 12.5,
    letterSpacing: 0.6,
    color: Palette.inkMuted,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '33.3333%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.line,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: Palette.brandTint,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  initial: { fontFamily: Font.bold, fontSize: 19, color: Palette.brand },
  name: { textAlign: 'center', color: Palette.ink },
  count: { fontFamily: Font.regular, fontSize: 11.5, color: Palette.inkFaint },
});
