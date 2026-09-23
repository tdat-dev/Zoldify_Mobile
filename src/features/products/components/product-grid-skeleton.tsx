import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { Radius } from '@/components/ui/theme';

/** Khung chờ cho lưới 2 cột — khớp dáng ProductCard để không giật khi có data. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cell}>
          <Skeleton width="100%" height={150} radius={Radius.card} />
          <Skeleton width="80%" height={13} style={styles.line} />
          <Skeleton width="45%" height={15} style={styles.price} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, columnGap: 12, rowGap: 18 },
  cell: { width: '47.5%', gap: 8 },
  line: { marginTop: 2 },
  price: {},
});
