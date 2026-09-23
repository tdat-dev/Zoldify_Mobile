import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Font, Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import { useFollowing } from '@/features/follows/api';
import { productKeys } from '@/features/products/api';
import { ProductCard } from '@/features/products/components/product-card';
import http from '@/lib/api/client';
import type { ApiResponse, Paginated, Product } from '@/api';

/**
 * Rail cá nhân hoá: hàng mới từ các shop người dùng đang theo dõi. BE chưa có
 * feed đa-shop nên gom client-side — mỗi shop lấy vài món rồi trộn, khử trùng,
 * sắp mới→cũ. Tự ẩn khi là khách / chưa theo dõi ai / không có hàng (không để
 * tiêu đề trơ khoảng trắng, giống RelatedRail).
 */
const MAX_SHOPS = 6;
const PER_SHOP = 4;
const MAX_ITEMS = 10;
const CARD_WIDTH = 150;

export function FollowingRail() {
  const me = useAuthStore((s) => s.user);
  const { data: shops } = useFollowing(me?.id);
  const shopIds = (shops ?? []).slice(0, MAX_SHOPS).map((s) => s.id);

  const results = useQueries({
    queries: shopIds.map((sid) => ({
      queryKey: [...productKeys.lists(), 'follow-rail', sid] as const,
      queryFn: async () => {
        const res = await http.get<ApiResponse<Paginated<Product>>>('/products', {
          params: { current: 1, pageSize: PER_SHOP, seller_id: sid },
        });
        return res.data.data.result;
      },
      staleTime: 60_000,
    })),
  });

  // Gộp mọi shop -> khử trùng theo id -> mới nhất trước.
  const seen = new Set<number>();
  const merged: Product[] = [];
  for (const r of results) {
    for (const p of r.data ?? []) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
    }
  }
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const items = merged.slice(0, MAX_ITEMS);

  if (!me || shopIds.length === 0 || items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text variant="heading">Từ shop bạn theo dõi</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/following')}>
          <Text style={styles.more}>Xem tất cả</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <ProductCard product={item} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  more: { fontFamily: Font.semibold, fontSize: 13, color: Palette.brand },
  row: { gap: 12, paddingHorizontal: 12 },
  card: { width: CARD_WIDTH },
});
