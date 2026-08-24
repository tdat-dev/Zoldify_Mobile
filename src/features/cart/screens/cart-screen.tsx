import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartQty,
} from '@/features/cart/api';
import { useAuthStore } from '@/features/auth/store';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import type { Cart } from '@/api';

/** Bộ tăng/giảm số lượng — phẳng 4px, hairline; nút trừ khoá ở mức 1. */
function QtyStepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  const minusOff = disabled || value <= 1;
  return (
    <View style={styles.stepper}>
      <Pressable
        style={[styles.stepBtn, minusOff && styles.stepBtnOff]}
        disabled={minusOff}
        onPress={() => onChange(value - 1)}
        hitSlop={4}>
        <Text style={[styles.stepGlyph, minusOff && styles.stepGlyphOff]}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        style={[styles.stepBtn, disabled && styles.stepBtnOff]}
        disabled={disabled}
        onPress={() => onChange(value + 1)}
        hitSlop={4}>
        <Text style={[styles.stepGlyph, disabled && styles.stepGlyphOff]}>+</Text>
      </Pressable>
    </View>
  );
}

function CartRow({
  item,
  busy,
  onQty,
  onRemove,
}: {
  item: Cart;
  busy: boolean;
  onQty: (next: number) => void;
  onRemove: () => void;
}) {
  const uri = mediaUrl(item.product?.image);
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.thumb}
        onPress={() =>
          router.push({ pathname: '/products/[id]', params: { id: item.product.id } })
        }>
        {uri ? (
          <Image source={uri} style={styles.thumbImg} contentFit="cover" />
        ) : null}
      </Pressable>

      <View style={styles.rowBody}>
        <Text variant="body" numberOfLines={2} style={styles.rowName}>
          {item.product?.name}
        </Text>
        <Text style={styles.rowPrice}>{formatVnd(item.product?.price)}</Text>
        <View style={styles.rowFooter}>
          {/* Đồ cũ thường là món DUY NHẤT (stock 1) — ẩn bộ +/− cho khỏi giống
              sàn nhiều số lượng; chỉ hiện khi người bán có >1 cùng món. */}
          {(item.product?.stock ?? 1) > 1 ? (
            <QtyStepper value={item.quantity} onChange={onQty} disabled={busy} />
          ) : (
            <Text style={styles.unique}>Món duy nhất</Text>
          )}
          <Pressable hitSlop={8} onPress={onRemove} disabled={busy}>
            <Text style={styles.remove}>Xoá</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Giỏ hàng — khách: mời đăng nhập; đã đăng nhập: danh sách thật + tổng tiền. */
export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const { data: items, isPending } = useCart();
  const updateQty = useUpdateCartQty();
  const remove = useRemoveCartItem();

  const busy = updateQty.isPending || remove.isPending;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const header = (
    <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
      <Pressable hitSlop={10} onPress={back} accessibilityLabel="Quay lại">
        <View style={styles.chevron} />
      </Pressable>
      <Text variant="title">Giỏ hàng</Text>
    </View>
  );

  if (guest) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading" style={styles.line}>Giỏ hàng của bạn</Text>
          <Text variant="bodyMuted" style={styles.line}>
            Đăng nhập để lưu giỏ hàng và thanh toán.
          </Text>
          <View style={styles.cta}>
            <Button title="Đăng nhập" onPress={() => router.push('/login')} />
          </View>
        </View>
      </View>
    );
  }

  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.brand} />
        </View>
      </View>
    );
  }

  const list = items ?? [];
  const total = list.reduce(
    (acc, i) => acc + Number(i.product?.price ?? 0) * (i.quantity ?? 1),
    0,
  );

  if (list.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading" style={styles.line}>Giỏ hàng trống</Text>
          <Text variant="bodyMuted" style={styles.line}>
            Chưa có món nào. Dạo một vòng xem có gì hay không nhé.
          </Text>
          <View style={styles.cta}>
            <Button title="Khám phá sản phẩm" onPress={() => router.push('/')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <FlatList
        data={list}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <CartRow
            item={item}
            busy={busy}
            onQty={(next) => updateQty.mutate({ id: item.id, quantity: next })}
            onRemove={() => remove.mutate(item.id)}
          />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.totalRow}>
          <Text variant="bodyMuted">Tạm tính</Text>
          <Text style={styles.total}>{formatVnd(total)}</Text>
        </View>
        <Text variant="caption" style={styles.note}>Phí vận chuyển tính ở bước thanh toán.</Text>
        <Button title="Thanh toán" onPress={() => router.push('/checkout')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  chevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.ink,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 16 },
  list: { padding: 12 },
  sep: { height: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.surfaceCard,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 10,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: Radius.control,
    backgroundColor: Palette.surfaceSunken,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  rowBody: { flex: 1, justifyContent: 'space-between', gap: 6 },
  rowName: { color: Palette.ink },
  rowPrice: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.price,
    fontVariant: ['tabular-nums'],
  },
  rowFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remove: { fontFamily: Font.medium, fontSize: 13, color: Palette.inkMuted },
  unique: { fontFamily: Font.semibold, fontSize: 12, color: Palette.inkMuted },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    borderRadius: Radius.control,
    overflow: 'hidden',
  },
  stepBtn: { width: 34, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.white },
  stepBtnOff: { backgroundColor: Palette.surfaceSunken },
  stepGlyph: { fontFamily: Font.semibold, fontSize: 18, color: Palette.ink, lineHeight: 20 },
  stepGlyphOff: { color: Palette.inkFaint },
  stepValue: {
    minWidth: 36,
    textAlign: 'center',
    fontFamily: Font.semibold,
    fontSize: 14,
    color: Palette.ink,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: {
    fontFamily: Font.extrabold,
    fontSize: 20,
    color: Palette.price,
    fontVariant: ['tabular-nums'],
  },
  note: { color: Palette.pendingFg },
});
