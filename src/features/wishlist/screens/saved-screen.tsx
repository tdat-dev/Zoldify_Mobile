import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';
import { useProduct } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';
import { useWishlistStore } from '@/features/wishlist/store';

/**
 * Một ô trong lưới đã lưu: tự nạp sản phẩm theo id. Món đã bị gỡ (404) thì tự
 * loại khỏi wishlist để danh sách không kẹt ô trống mãi.
 */
function SavedCell({ id }: { id: number }) {
  const { data, isPending, isError } = useProduct(id);
  const toggle = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    if (isError) toggle(id); // gỡ id hỏng khỏi danh sách đã lưu
  }, [isError, id, toggle]);

  if (isPending) {
    return (
      <View style={styles.cell}>
        <Skeleton width="100%" height={150} radius={Radius.card} />
        <Skeleton width="80%" height={13} style={styles.sk} />
        <Skeleton width="45%" height={15} />
      </View>
    );
  }
  if (isError || !data) return null;
  return (
    <View style={styles.cell}>
      <ProductCard product={data} />
    </View>
  );
}

/** Màn "Đã lưu" — các món đã bấm tim (lưu cục bộ theo thiết bị). */
export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const ids = useWishlistStore((s) => s.ids);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Đã lưu</Text>
      </View>

      {ids.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={44} color={Palette.inkFaint} />
          <Text variant="heading" style={styles.line}>Chưa lưu món nào</Text>
          <Text variant="bodyMuted" style={styles.line}>
            Bấm hình tim ở món bạn thích để lưu lại xem sau nhé.
          </Text>
          <View style={styles.cta}>
            <Button title="Khám phá sản phẩm" onPress={() => router.push('/')} />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}>
          {ids.map((id) => (
            <SavedCell key={id} id={id} />
          ))}
        </ScrollView>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, columnGap: 12, rowGap: 18 },
  cell: { width: '47.5%', gap: 8 },
  sk: { marginTop: 2 },
});
