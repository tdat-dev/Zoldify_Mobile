import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { RatingStars } from '@/components/ui/rating';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import type { MockReview } from '@/features/reviews/mock';
import { mediaUrl } from '@/lib/media';

/** Một thẻ đánh giá — avatar, tên, sao, thời gian, nội dung + ảnh (nếu có). */
export function ReviewCard({ review }: { review: MockReview }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Avatar name={review.author} size={32} />
        <View style={styles.who}>
          <View style={styles.nameRow}>
            <Text variant="subheading" style={styles.name}>{review.author}</Text>
            {review.mine ? <View style={styles.mineTag}><Text style={styles.mineText}>Bạn</Text></View> : null}
          </View>
          <RatingStars value={review.rating} size={11} />
        </View>
        <Text variant="caption" style={styles.time}>{review.timeLabel}</Text>
      </View>

      {review.comment ? <Text variant="body" style={styles.comment}>{review.comment}</Text> : null}

      {review.photos?.length ? (
        <View style={styles.photos}>
          {review.photos.map((p, i) => (
            <Image key={i} source={mediaUrl(p)} style={styles.photo} contentFit="cover" transition={120} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.control,
    padding: 12,
    backgroundColor: Palette.white,
    gap: 8,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  who: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14 },
  mineTag: { backgroundColor: Palette.brandTint, borderRadius: Radius.control, paddingHorizontal: 6, paddingVertical: 1 },
  mineText: { fontFamily: Font.semibold, fontSize: 10.5, color: Palette.brand },
  time: { color: Palette.inkFaint },
  comment: { color: Palette.ink },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 72, height: 72, borderRadius: Radius.control, backgroundColor: Palette.surfaceSunken },
});
