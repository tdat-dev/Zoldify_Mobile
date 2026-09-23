import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { RatingStars } from '@/components/ui/rating';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { ReviewCard } from '@/features/reviews/components/review-card';
import {
  productRating,
  productReviews,
  ratingBreakdown,
  type MockReview,
} from '@/features/reviews/mock';
import { useReviewStore } from '@/features/reviews/store';

type Filter = 'all' | 'photo' | 5 | 4;

/** Màn "Tất cả đánh giá" — tóm tắt điểm + phân bố sao + lọc + danh sách. */
export default function ReviewsListScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const reviewMap = useReviewStore((s) => s.byProduct);
  const mine = reviewMap[productId] ?? [];
  const summary = productRating(productId);
  const breakdown = ratingBreakdown(productId);
  const [filter, setFilter] = useState<Filter>('all');

  const all = useMemo<MockReview[]>(
    () => [...mine, ...productReviews(productId, 12)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reviewMap, productId],
  );
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

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Đánh giá</Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.summary}>
              <View style={styles.summaryLeft}>
                <Text style={styles.big}>{summary.rating.toFixed(1)}</Text>
                <RatingStars value={summary.rating} size={14} />
                <Text variant="caption" style={styles.count}>{summary.count} đánh giá</Text>
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
        }
        ListEmptyComponent={<View style={styles.empty}><Text variant="bodyMuted">Chưa có đánh giá khớp bộ lọc.</Text></View>}
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
  empty: { alignItems: 'center', paddingVertical: 48 },
});
