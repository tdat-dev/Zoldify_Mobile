import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/ui/rating';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProductReviews } from '@/features/reviews/api';
import { ReviewCard } from '@/features/reviews/components/review-card';

type Filter = 'all' | 'photo' | 5 | 4;

/** Số đánh giá tải về để lọc và vẽ phân bố sao. Đủ cho một món đồ cũ. */
const LIMIT = 50;

/**
 * Màn "Tất cả đánh giá": tóm tắt điểm, phân bố sao, lọc, danh sách. Mọi con số
 * từ backend (trước đây sinh ngẫu nhiên trong mock.ts, lỗi H-01).
 */
export default function ReviewsListScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const { data, isPending, isError, refetch } = useProductReviews(productId, LIMIT);
  const [filter, setFilter] = useState<Filter>('all');

  const all = data?.reviews ?? [];
  // Phân bố đếm trên các đánh giá đã tải (tối đa LIMIT); điểm và tổng thì lấy
  // từ backend, tính trên toàn bộ.
  const breakdown = useMemo(() => {
    const b = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    for (const r of all) {
      const s = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      b[s] += 1;
    }
    return b;
  }, [all]);
  const list = all.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'photo') return (r.photos?.length ?? 0) > 0;
    return r.rating === filter;
  });
  const maxBar = Math.max(1, ...([5, 4, 3, 2, 1] as const).map((s) => breakdown[s]));

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'photo', label: 'Có ảnh' },
    { key: 5, label: '5 sao' },
    { key: 4, label: '4 sao' },
  ];

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <BackChevron onPress={back} />
      <Text variant="title">Đánh giá</Text>
    </View>
  );

  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading">Không tải được đánh giá</Text>
          <View style={styles.cta}><Button title="Thử lại" onPress={() => refetch()} /></View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <FlatList
        data={list}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={
          data.total > 0 ? (
            <View style={styles.headerBlock}>
              <View style={styles.summary}>
                <View style={styles.summaryLeft}>
                  <Text style={styles.big}>{data.average.toFixed(1)}</Text>
                  <RatingStars value={data.average} size={14} />
                  <Text variant="caption" style={styles.count}>{data.total} đánh giá</Text>
                </View>
                <View style={styles.bars}>
                  {([5, 4, 3, 2, 1] as const).map((s) => (
                    <View key={s} style={styles.barRow}>
                      <Text style={styles.barStar}>{s}</Text>
                      <Ionicons name="star" size={11} color={Palette.pendingFg} />
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${(breakdown[s] / maxBar) * 100}%` }]} />
                      </View>
                      <Text style={styles.barCount}>{breakdown[s]}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.chips}>
                {chips.map((c) => {
                  const on = c.key === filter;
                  return (
                    <Pressable key={String(c.key)} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilter(c.key)}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyMuted">
              {data.total === 0
                ? 'Chưa có đánh giá nào. Người mua viết được đánh giá sau khi nhận hàng.'
                : 'Chưa có đánh giá khớp bộ lọc.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <ReviewCard review={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  cta: { alignSelf: 'stretch', paddingHorizontal: 24 },
  list: { padding: 12, gap: 12 },
  sep: { height: 12 },
  headerBlock: { gap: 14, marginBottom: 2 },
  summary: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 16,
  },
  summaryLeft: { alignItems: 'center', gap: 4, justifyContent: 'center' },
  big: { fontFamily: Font.extrabold, fontSize: 40, color: Palette.ink },
  count: { color: Palette.inkFaint },
  bars: { flex: 1, justifyContent: 'center', gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barStar: { fontFamily: Font.medium, fontSize: 12, color: Palette.inkMuted, width: 8 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Palette.surfaceSunken, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Palette.pendingFg },
  barCount: { fontFamily: Font.regular, fontSize: 11, color: Palette.inkFaint, width: 28, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  chipOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  chipText: { fontFamily: Font.medium, fontSize: 13, color: Palette.ink },
  chipTextOn: { color: Palette.brand, fontFamily: Font.semibold },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
});
