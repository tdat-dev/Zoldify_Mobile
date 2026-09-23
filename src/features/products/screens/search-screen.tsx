import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useProductSearch } from '@/features/products/api';
import { FilterBar } from '@/features/products/components/filter-bar';
import { ProductCard } from '@/features/products/components/product-card';
import { EMPTY_QUERY, type ProductQuery } from '@/features/products/filters';

/** Trả về giá trị đã trễ `ms` mili-giây để không gọi API mỗi lần gõ phím. */
function useDebounced(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Đổi param URL (string | string[] | undefined) thành số, rỗng -> undefined. */
function numParam(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (s == null || s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Tìm kiếm — theo từ khoá (?q=) VÀ/HOẶC theo tầm tiền (?price_min/?price_max
 * do "Mọi giá" ở header truyền sang). Có tầm tiền thì chạy ngay dù chưa gõ chữ.
 */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ price_min?: string; price_max?: string }>();
  const priceMin = numParam(params.price_min);
  const priceMax = numParam(params.price_max);

  // Bộ lọc seed từ URL (nút "Mọi giá" ở header truyền sang), sau đó FilterBar
  // tự quản. Chỉ đọc param một lần khi mount.
  const [query, setQuery] = useState<ProductQuery>({
    ...EMPTY_QUERY,
    price_min: priceMin,
    price_max: priceMax,
  });

  const [text, setText] = useState('');
  const q = useDebounced(text, 350);
  const hasFilter = query.price_min != null || query.price_max != null || query.condition != null;
  const active = q.trim().length >= 2 || hasFilter;

  const { data, isFetching, isError } = useProductSearch({
    q,
    price_min: query.price_min,
    price_max: query.price_max,
    condition: query.condition,
    sort: query.sort,
  });
  const results = data?.result ?? [];

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.root}>
      <View style={[styles.chrome, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} onPress={back} accessibilityLabel="Quay lại">
          <View style={styles.chevron} />
        </Pressable>

        <View style={styles.searchBox}>
          <View style={styles.magCircle} />
          <View style={styles.magHandle} />
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Tìm sản phẩm trên Zoldify"
            placeholderTextColor={Palette.inkFaint}
            autoFocus={!hasFilter}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {text ? (
            <Pressable hitSlop={8} onPress={() => setText('')}>
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FilterBar value={query} onChange={setQuery} />

      {!active ? (
        <View style={styles.center}>
          <Text variant="bodyMuted" style={styles.hint}>
            Nhập tên món bạn muốn tìm (từ 2 ký tự).
          </Text>
        </View>
      ) : isFetching && results.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.brand} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="bodyMuted" style={styles.hint}>Có lỗi khi tìm. Thử lại nhé.</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text variant="heading">Không tìm thấy</Text>
          <Text variant="bodyMuted" style={styles.hint}>
            {q.trim().length >= 2
              ? `Không có kết quả cho “${q.trim()}”.`
              : 'Không có món nào trong tầm tiền này.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text variant="caption" style={styles.count}>
              {data?.meta?.total ?? results.length} kết quả
            </Text>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.brand,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: Radius.control,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    gap: 8,
  },
  magCircle: { width: 13, height: 13, borderRadius: 999, borderWidth: 2, borderColor: Palette.inkFaint },
  magHandle: {
    position: 'absolute',
    left: 22,
    top: 24,
    width: 6,
    height: 2,
    backgroundColor: Palette.inkFaint,
    transform: [{ rotate: '45deg' }],
  },
  input: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.ink, paddingVertical: 0 },
  clear: { fontFamily: Font.medium, fontSize: 16, color: Palette.inkFaint },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
  hint: { textAlign: 'center' },
  list: { padding: 12, gap: 18 },
  column: { gap: 12 },
  count: { marginBottom: 4 },
});
