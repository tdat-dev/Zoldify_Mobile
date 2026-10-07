import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { KEYBOARD_GAP } from '@/components/ui/screen';
import { Button } from '@/components/ui/button';
import { PhotoUploadGrid } from '@/components/ui/photo-upload-grid';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProduct } from '@/features/products/api';
import { useCreateReview } from '@/features/reviews/api';
import { apiErrorMessage } from '@/lib/api/error-message';
import { uploadImage } from '@/lib/upload';

const RATING_WORD = ['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];

/**
 * Viết đánh giá cho một sản phẩm, mở từ chi tiết đơn ĐÃ GIAO (cần `orderId`:
 * backend chỉ nhận đánh giá gắn với đơn đã giao có món này).
 *
 * Trước đây đánh giá chỉ lưu trên máy người viết, không ai khác thấy và mất khi
 * đổi máy (lỗi H-01 test E2E 30/09). Giờ gửi POST /interactions.
 */
export default function WriteReviewScreen() {
  const insets = useSafeAreaInsets();
  const { id, orderId } = useLocalSearchParams<{ id: string; orderId?: string }>();
  const productId = Number(id);
  const { data: product } = useProduct(productId);
  const createReview = useCreateReview();

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
    if (!orderId) {
      setErr('Mở màn này từ đơn đã nhận hàng để đánh giá nhé.');
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
      await createReview.mutateAsync({
        product_id: productId,
        order_id: Number(orderId),
        rating,
        comment: comment.trim(),
        images: uploaded.length ? uploaded : undefined,
      });
      back();
    } catch (e) {
      setErr(apiErrorMessage(e, 'Chưa gửi được đánh giá. Thử lại nhé.'));
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

      <KeyboardAwareScrollView bottomOffset={KEYBOARD_GAP} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
      </KeyboardAwareScrollView>

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
