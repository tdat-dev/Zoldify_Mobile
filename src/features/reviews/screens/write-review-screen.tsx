import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { PhotoUploadGrid } from '@/components/ui/photo-upload-grid';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProduct } from '@/features/products/api';
import { useReviewStore } from '@/features/reviews/store';
import { uploadImage } from '@/lib/upload';

const RATING_WORD = ['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];

/** Viết đánh giá cho một sản phẩm (mở sau khi nhận hàng). */
export default function WriteReviewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const { data: product } = useProduct(productId);
  const addReview = useReviewStore((s) => s.add);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSubmit = async () => {
    if (!comment.trim()) {
      setErr('Viết vài dòng cảm nhận nhé.');
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      // Upload ảnh (nếu có) lên R2 rồi lưu URL; hỏng thì bỏ qua ảnh, vẫn gửi.
      let uploaded: string[] = [];
      try {
        uploaded = await Promise.all(photos.map((u) => uploadImage(u, 'reviews')));
      } catch {
        uploaded = [];
      }
      addReview(productId, {
        author: 'Bạn',
        rating,
        comment: comment.trim(),
        timeLabel: 'vừa xong',
        photos: uploaded.length ? uploaded : undefined,
      });
      back();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Viết đánh giá</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {product?.name ? (
          <Text variant="bodyMuted" numberOfLines={1} style={styles.product}>{product.name}</Text>
        ) : null}

        <View style={styles.starsBlock}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} hitSlop={6} onPress={() => setRating(i)}>
                <Ionicons
                  name={i <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={i <= rating ? Palette.pendingFg : Palette.lineStrong}
                />
              </Pressable>
            ))}
          </View>
          <Text variant="subheading" style={styles.ratingWord}>{RATING_WORD[rating]}</Text>
        </View>

        <View>
          <Text variant="label" style={styles.label}>Cảm nhận của bạn</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Sản phẩm có đúng mô tả không? Chất lượng, đóng gói, giao hàng thế nào?"
            placeholderTextColor={Palette.inkFaint}
            multiline
          />
        </View>

        <View>
          <Text variant="label" style={styles.label}>Thêm ảnh (tuỳ chọn)</Text>
          <PhotoUploadGrid value={photos} onChange={setPhotos} max={5} />
        </View>

        {err ? <View style={styles.errBanner}><Text style={styles.errText}>{err}</Text></View> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title={submitting ? 'Đang gửi…' : 'Gửi đánh giá'} onPress={onSubmit} loading={submitting} />
      </View>
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
  body: { padding: 16, gap: 18 },
  product: {},
  starsBlock: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  stars: { flexDirection: 'row', gap: 8 },
  ratingWord: { color: Palette.pendingFg },
  label: { marginBottom: 8 },
  input: {
    minHeight: 110,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    padding: 14,
    textAlignVertical: 'top',
    fontFamily: Font.regular,
    fontSize: 14.5,
    color: Palette.ink,
    backgroundColor: Palette.white,
  },
  errBanner: { backgroundColor: Palette.dangerBg, borderRadius: 4, padding: 12 },
  errText: { color: Palette.dangerFg, fontSize: 13 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
});
