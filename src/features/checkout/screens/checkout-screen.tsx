import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useCart } from '@/features/cart/api';
import { GhnAddressForm, type GhnAddressSelection } from '@/features/checkout/ghn-address-form';
import { useCreateOrder, useShippingQuote } from '@/features/orders/api';
import type { CreateOrderDto } from '@/api';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';

const EMPTY_ADDRESS: GhnAddressSelection = {
  receiver_name: '',
  receiver_phone: '',
  shipping_address: '',
  province: '',
  district: '',
  ghn_district_id: 0,
  ghn_ward_code: '',
};

type PayMethod = NonNullable<CreateOrderDto['payment_method']>;
const PAY_OPTIONS: { value: PayMethod; title: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'cod', title: 'Thanh toán khi nhận (COD)', desc: 'Trả tiền mặt khi nhận hàng', icon: 'truck' },
  { value: 'wallet', title: 'Ví Zoldify', desc: 'Trừ vào số dư ví của bạn', icon: 'credit-card' },
];

/** Thanh toán: địa chỉ GHN → phí ship theo người bán → tạo đơn (COD/Ví). */
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { data: items = [], isPending } = useCart();
  const [address, setAddress] = useState<GhnAddressSelection>(EMPTY_ADDRESS);
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<PayMethod>('cod');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const quote = useShippingQuote();
  const create = useCreateOrder();

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.product?.price ?? 0) * (i.quantity ?? 1), 0),
    [items],
  );
  const shippingFee = quote.data?.total ?? 0;
  const grandTotal = subtotal + shippingFee;

  const addressReady = !!address.receiver_name && !!address.receiver_phone && !!address.shipping_address;
  const ghnReady = !!address.ghn_district_id && !!address.ghn_ward_code;

  // Báo phí ship khi đã chọn xong quận + phường (mã GHN) và có món.
  useEffect(() => {
    if (!ghnReady || items.length === 0) return;
    quote.mutate({
      to_district_id: address.ghn_district_id,
      to_ward_code: address.ghn_ward_code,
      cart_item_ids: items.map((i) => i.id),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.ghn_district_id, address.ghn_ward_code, items.length]);

  const onSubmit = () => {
    setErrMsg(null);
    if (!addressReady) {
      setErrMsg('Nhập đủ người nhận, số điện thoại và địa chỉ nhé.');
      return;
    }
    const dto: CreateOrderDto = {
      receiver_name: address.receiver_name,
      receiver_phone: address.receiver_phone,
      shipping_address: address.shipping_address,
      province: address.province,
      district: address.district,
      ghn_district_id: address.ghn_district_id || undefined,
      ghn_ward_code: address.ghn_ward_code || undefined,
      note: note.trim() || undefined,
      payment_method: payment,
      cart_item_ids: items.map((i) => i.id),
    };
    create.mutate(dto, {
      onSuccess: () => router.replace('/orders'),
      onError: (e) => {
        const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
        setErrMsg(Array.isArray(msg) ? String(msg[0]) : typeof msg === 'string' ? msg : 'Đặt hàng chưa được. Thử lại nhé.');
      },
    });
  };

  const header = (
    <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
      <BackChevron tone="light" onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart'))} />
      <Text variant="title">Thanh toán</Text>
    </View>
  );

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

  if (items.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading">Chưa có món để thanh toán</Text>
          <View style={styles.emptyCta}>
            <Button title="Về giỏ hàng" variant="secondary" onPress={() => router.replace('/cart')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Địa chỉ nhận */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Feather name="map-pin" size={16} color={Palette.brand} />
            <Text variant="heading">Giao tới</Text>
          </View>
          <GhnAddressForm onChange={setAddress} />
        </View>

        {/* Lời nhắn */}
        <View style={styles.card}>
          <Text variant="heading" style={styles.noteHead}>Lời nhắn cho người bán</Text>
          <TextField
            value={note}
            onChangeText={setNote}
            placeholder="VD: Giao giờ hành chính, gọi trước khi tới…"
            multiline
            numberOfLines={2}
            style={styles.noteInput}
          />
        </View>

        {/* Món */}
        <View style={styles.card}>
          <Text variant="heading" style={styles.noteHead}>{items.length} món</Text>
          <View style={styles.itemList}>
            {items.map((it) => {
              const uri = mediaUrl(it.product?.image);
              return (
                <View key={it.id} style={styles.itemRow}>
                  <View style={styles.itemThumb}>
                    {uri ? <Image source={uri} style={styles.itemThumbImg} contentFit="cover" /> : null}
                  </View>
                  <View style={styles.itemBody}>
                    <Text variant="body" numberOfLines={2}>{it.product?.name}</Text>
                    <Text variant="caption">
                      {formatVnd(it.product?.price)}
                      {it.quantity > 1 ? ` × ${it.quantity}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatVnd(Number(it.product?.price ?? 0) * (it.quantity ?? 1))}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.card}>
          <Text variant="heading" style={styles.noteHead}>Phương thức thanh toán</Text>
          <View style={styles.payList}>
            {PAY_OPTIONS.map((opt) => {
              const on = payment === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.payRow, on && styles.payRowOn]}
                  onPress={() => setPayment(opt.value)}>
                  <Ionicons
                    name={on ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={on ? Palette.brand : Palette.inkFaint}
                  />
                  <View style={styles.payInfo}>
                    <Text variant="subheading">{opt.title}</Text>
                    <Text variant="caption">{opt.desc}</Text>
                  </View>
                  <Feather name={opt.icon} size={18} color={Palette.inkMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tóm tắt tiền */}
        <View style={styles.card}>
          <View style={styles.sumRow}>
            <Text variant="bodyMuted">Tiền hàng</Text>
            <Text style={styles.sumValue}>{formatVnd(subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text variant="bodyMuted">Phí vận chuyển</Text>
            <Text style={styles.sumValue}>
              {!ghnReady ? 'Chọn địa chỉ' : quote.isPending ? 'Đang tính…' : shippingFee === 0 ? 'Miễn phí' : formatVnd(shippingFee)}
            </Text>
          </View>

          {/* Phí ship tách theo từng người bán (GHN mỗi shop gửi riêng). */}
          {quote.data && quote.data.items.length > 1 ? (
            <View style={styles.byShop}>
              <Text variant="caption" style={styles.byShopHead}>Phí ship theo người bán</Text>
              {quote.data.items.map((s) => (
                <View key={s.seller_id} style={styles.byShopRow}>
                  <Text variant="caption" numberOfLines={1} style={styles.byShopName}>{s.seller_name}</Text>
                  <Text variant="caption">{s.fee === 0 ? 'Miễn phí' : formatVnd(s.fee)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {quote.data?.items.some((s) => !s.has_pickup) ? (
            <Text variant="caption" style={styles.warn}>
              Một số người bán chưa cài địa chỉ lấy hàng — phí có thể tính lại khi xử lý đơn.
            </Text>
          ) : null}
        </View>

        {errMsg ? (
          <View style={styles.errBox}>
            <Text variant="caption" style={styles.errText}>{errMsg}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.totalRow}>
          <Text variant="bodyMuted">Tổng thanh toán</Text>
          <Text style={styles.total}>{formatVnd(grandTotal)}</Text>
        </View>
        <Button
          title={create.isPending ? 'Đang đặt…' : 'Đặt hàng'}
          onPress={onSubmit}
          loading={create.isPending}
          disabled={!addressReady || create.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyCta: { alignSelf: 'stretch', paddingHorizontal: 24 },
  body: { padding: 12, gap: 12 },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  noteHead: { marginBottom: 12 },
  noteInput: { minHeight: 60, textAlignVertical: 'top', paddingTop: 10 },
  itemList: { gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.control,
    backgroundColor: Palette.surfaceSunken,
    overflow: 'hidden',
  },
  itemThumbImg: { width: '100%', height: '100%' },
  itemBody: { flex: 1, gap: 2 },
  itemTotal: { fontFamily: Font.bold, fontSize: 14, color: Palette.price, fontVariant: ['tabular-nums'] },
  payList: { gap: 10 },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  payRowOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  payInfo: { flex: 1, gap: 2 },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  sumValue: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, fontVariant: ['tabular-nums'] },
  byShop: { marginTop: 8, backgroundColor: Palette.surfaceSunken, borderRadius: Radius.control, padding: 10, gap: 6 },
  byShopHead: { fontFamily: Font.semibold },
  byShopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  byShopName: { flex: 1, color: Palette.inkMuted },
  warn: { color: Palette.pendingFg, marginTop: 8 },
  errBox: { backgroundColor: Palette.dangerBg, borderRadius: Radius.control, paddingHorizontal: 12, paddingVertical: 10 },
  errText: { color: Palette.dangerFg },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { fontFamily: Font.extrabold, fontSize: 20, color: Palette.price, fontVariant: ['tabular-nums'] },
});
