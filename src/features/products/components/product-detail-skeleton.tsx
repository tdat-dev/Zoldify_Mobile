import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Radius } from '@/components/ui/theme';

/**
 * Khung chờ cho trang chi tiết — dựng đúng bố cục thật (ảnh vuông → tiêu đề →
 * giá → tình trạng → người bán) để khi dữ liệu về không giật layout. Thay cho
 * spinner giữa màn. Phẳng, nhịp mờ nhẹ theo doctrine "sổ kê".
 */
export function ProductDetailSkeleton() {
  return (
    <View style={styles.root}>
      {/* Ảnh sản phẩm (tỉ lệ vuông như ImageGallery) */}
      <Skeleton width="100%" height="auto" radius={0} style={styles.image} />

      <View style={styles.body}>
        {/* Tiêu đề 2 dòng */}
        <Skeleton width="88%" height={18} />
        <Skeleton width="62%" height={18} />

        {/* Giá */}
        <Skeleton width={140} height={26} style={styles.price} />

        {/* Badge tình trạng + sao */}
        <View style={styles.tagRow}>
          <Skeleton width={96} height={24} radius={Radius.control} />
          <Skeleton width={72} height={16} />
        </View>

        {/* Thẻ người bán */}
        <View style={styles.sellerCard}>
          <Skeleton width={44} height={44} radius={22} />
          <View style={styles.sellerText}>
            <Skeleton width="55%" height={15} />
            <Skeleton width="35%" height={12} />
          </View>
        </View>

        {/* Mô tả */}
        <View style={styles.desc}>
          <Skeleton width="100%" height={13} />
          <Skeleton width="94%" height={13} />
          <Skeleton width="80%" height={13} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  image: { aspectRatio: 1, height: 'auto' },
  body: { padding: 16, gap: 10 },
  price: { marginTop: 6 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.card,
  },
  sellerText: { flex: 1, gap: 6 },
  desc: { marginTop: 12, gap: 8 },
});
