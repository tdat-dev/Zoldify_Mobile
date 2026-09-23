import { StyleSheet, View } from 'react-native';

import { Skeleton } from './skeleton';
import { Palette } from './theme';

/**
 * Khung chờ cho màn danh sách kiểu hàng (tin nhắn, thông báo, đơn): avatar tròn
 * + 2 dòng chữ. Giữ đúng bố cục lúc tải nên không giật khi dữ liệu về. Thay cho
 * spinner giữa màn.
 */
export function ListRowSkeleton({ count = 7 }: { count?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={52} height={52} radius={26} />
          <View style={styles.body}>
            <Skeleton width="52%" height={14} />
            <Skeleton width="82%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  body: { flex: 1, gap: 8 },
});
