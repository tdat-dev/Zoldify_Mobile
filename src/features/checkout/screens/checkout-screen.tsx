import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { RemoteImage } from '@/components/ui/remote-image';
import { BackChevron } from '@/components/ui/back-chevron';
import { KEYBOARD_GAP } from '@/components/ui/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAddresses, type Address } from '@/features/addresses/api';
import { useAuthStore } from '@/features/auth/store';
import { isCartItemAvailable, useCart, useRefetchCartOnFocus } from '@/features/cart/api';
import { type GhnAddressSelection } from '@/features/checkout/ghn-address-form';
import { useCreateOrder, usePayOrderWithWallet, useShippingQuote, useWalletBalance } from '@/features/orders/api';
import { orderPayosUrl } from '@/features/orders/payos-checkout';
import { openPayosWeb } from '@/features/payments/open-payos';
import type { CreateOrderDto, Order } from '@/api';
import { apiErrorMessage } from '@/lib/api/error-message';
import { formatVnd } from '@/lib/format';

const EMPTY_ADDRESS: GhnAddressSelection = {
  receiver_name: '',
  receiver_phone: '',
  shipping_address: '',
  province: '',
  district: '',
  ward: '',
  street: '',
  ghn_province_id: 0,
  ghn_district_id: 0,
  ghn_ward_code: '',
};

/** Địa chỉ đã lưu -> dạng GhnAddressSelection để dùng chung luồng tính phí/đặt đơn. */
function toSelection(a: Address): GhnAddressSelection {
  return {
    receiver_name: a.recipient_name,
    receiver_phone: a.phone_number,
    shipping_address: [a.street, a.ward, a.district, a.province].filter(Boolean).join(', '),
    province: a.province,
    district: a.district,
    ward: a.ward ?? '',
    street: a.street,
    ghn_province_id: a.ghn_province_id ?? 0,
    ghn_district_id: a.ghn_district_id ?? 0,
    ghn_ward_code: a.ghn_ward_code ?? '',
  };
}

type PayMethod = NonNullable<CreateOrderDto['payment_method']>;
/**
 * Ba cách trả, giống hệt web (`Zoldify_Frontend/src/app/checkout/page.tsx`):
 * `payos` là "Thẻ hoặc QR" — tạo đơn xong app chuyển sang trang PayOS có mã
 * VietQR. Trước đây app gửi 'bank_transfer' và KHÔNG tạo link, nên chọn xong
 * đơn nằm ở "Chưa trả" mà không có gì để quét.
 */
const PAY_OPTIONS: { value: PayMethod; title: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'cod', title: 'Thanh toán khi nhận (COD)', desc: 'Trả tiền mặt khi nhận hàng', icon: 'truck' },
  { value: 'wallet', title: 'Ví Zoldify', desc: 'Trừ vào số dư ví của bạn', icon: 'credit-card' },
  { value: 'payos', title: 'Thẻ hoặc QR (PayOS)', desc: 'Quét mã QR hoặc chuyển khoản, thẻ ATM', icon: 'smartphone' },
];

/** Thanh toán: địa chỉ GHN → phí ship theo người bán → tạo đơn (COD / Ví / PayOS). */
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  // `only` = mua ngay 1 món: chỉ thanh toán đúng cart item đó, không phải cả giỏ.
  const { only } = useLocalSearchParams<{ only?: string }>();
  const { data: cart = [], isPending } = useCart();
  useRefetchCartOnFocus();
  const picked = only ? cart.filter((i) => String(i.id) === String(only)) : cart;
  // Món hết hàng/không còn bán: bỏ ra, không thì một món kéo cả đơn hỏng.
  const items = picked.filter(isCartItemAvailable);
  const soldOutCount = picked.length - items.length;
  const { data: addresses = [], isSuccess: addressesLoaded } = useAddresses();
  const [address, setAddress] = useState<GhnAddressSelection>(EMPTY_ADDRESS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<PayMethod>('cod');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const hasSaved = addresses.length > 0;

  // Địa chỉ VỪA THÊM từ màn này (id mới so với lần nạp trước) thì chọn luôn:
  // người dùng thêm địa chỉ là để giao tới đó. Test máy ảo 05/10: thêm địa chỉ
  // Thành phố Hưng Yên xong quay về, checkout vẫn giữ địa chỉ Văn Giang cũ (GHN
  // không giao), phải mở danh sách chọn lại bằng tay. Chỉ so sau khi đã nạp
  // xong lần đầu, nếu không thì mọi địa chỉ đều thành "mới".
  const knownIds = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!addressesLoaded) return;
    const prev = knownIds.current;
    knownIds.current = new Set(addresses.map((a) => a.id));
    if (!prev) return;
    const added = addresses.filter((a) => !prev.has(a.id));
    if (added.length > 0) setSelectedId(added[added.length - 1].id);
  }, [addressesLoaded, addresses]);

  // Tự chọn địa chỉ mặc định (hoặc mới nhất) khi vào màn, hoặc khi địa chỉ
  // đang chọn bị xoá.
  useEffect(() => {
    if (!hasSaved) return;
    const stillThere = selectedId !== null && addresses.some((a) => a.id === selectedId);
    if (stillThere) return;
    const def = addresses.find((a) => a.is_default) ?? addresses[0];
    // Đồng bộ lựa chọn theo danh sách server; tách ra state dẫn xuất phải đổi
    // cả luồng chọn tay, để nguyên có chủ đích.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(def.id);
  }, [hasSaved, addresses, selectedId]);

  // Đổ địa chỉ đã chọn vào `address` (nguồn cho tính phí + đặt đơn).
  useEffect(() => {
    if (selectedId === null) return;
    const a = addresses.find((x) => x.id === selectedId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (a) setAddress(toSelection(a));
  }, [selectedId, addresses]);

  const quote = useShippingQuote();
  const create = useCreateOrder();
  // Một khoá cho cả phiên thanh toán: lần trước lỗi mà chưa tạo đơn thì server
  // xử lý như mới, lần trước đã tạo (chỉ mất phản hồi) thì trả lại đúng đơn đó.
  const idempotencyKey = useRef<string | null>(null);
  idempotencyKey.current ??= Crypto.randomUUID();
  const pay = usePayOrderWithWallet();
  const wallet = useWalletBalance();
  const submitting = create.isPending || pay.isPending;
  /**
   * Đang xin link PayOS sau khi đơn đã tạo (2 lượt gọi mạng) — giỏ lúc này đã bị
   * làm rỗng nên nếu chỉ dựa vào `submitting` thì màn nháy "Chưa có món để
   * thanh toán" rồi mới mở trang trả tiền. Bật cờ này để giữ vòng chờ.
   */
  const [payosOpening, setPayosOpening] = useState(false);
  const busy = submitting || payosOpening;

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.product?.price ?? 0) * (i.quantity ?? 1), 0),
    [items],
  );
  const shippingFee = quote.data?.total ?? 0;
  // GHN không tính được phí thì server trả ok=false (hoặc error theo người
  // bán). Trước đây app hiện "Miễn phí" và vẫn cho đặt: đơn đi Văn Giang (quận
  // GHN đã ngừng phục vụ) lên 0đ rồi kẹt ở bước tạo vận đơn (lỗi H-07 test E2E).
  const failedQuote = quote.data?.items.find((s) => s.error);
  const feeFailure = failedQuote?.error;
  const feeError = quote.isError
    ? 'Chưa tính được phí vận chuyển. Thử lại hoặc chọn địa chỉ khác nhé.'
    : quote.data && (quote.data.ok === false || feeFailure)
      ? failedQuote
        ? `GHN chưa giao được tới địa chỉ này: ${feeFailure}.`
        : 'GHN chưa tính được phí vận chuyển cho đơn này. Thử lại hoặc chọn địa chỉ khác nhé.'
      : null;
  // GHN báo không có tuyến tới quận nhận: thường do địa chỉ lưu mã quận cũ mà
  // GHN đã ngừng phục vụ (D-04, E2E 02/11: quận 2045). Nói rõ và cho mở ngay
  // địa chỉ đó để chọn lại quận, thay vì chỉ bảo "chọn địa chỉ khác".
  const noRoute = !!feeFailure && /tuyến|route|quận nhận|district/i.test(feeFailure);
  // Đơn có món của chính shop mình (hay gặp lúc thử app): địa chỉ LẤY hàng của
  // shop cũng có thể mang mã GHN cũ, và sửa địa chỉ NHẬN sẽ không bao giờ hết lỗi.
  const me = useAuthStore((s) => s.user);
  const failingIsMyShop = !!failedQuote && !!me && failedQuote.seller_id === me.id;
  const grandTotal = subtotal + shippingFee;
  const currency = items[0]?.product?.currency;
  // Biết chắc ví không đủ thì không cho đặt: tạo đơn xong mới trừ hụt là để
  // lại một đơn chưa trả mà kho đã bị giữ (web đã chặn từ trước).
  const walletShort =
    payment === 'wallet' && wallet.data !== undefined && !feeError && wallet.data.balance < grandTotal;

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

  /** GHN lỗi tạm thời (timeout, 5xx) thì không cần đổi địa chỉ — hỏi lại là được. */
  const retryQuote = () => {
    if (!ghnReady || items.length === 0) return;
    quote.mutate({
      to_district_id: address.ghn_district_id,
      to_ward_code: address.ghn_ward_code,
      cart_item_ids: items.map((i) => i.id),
    });
  };

  const onSubmit = () => {
    setErrMsg(null);
    if (!addressReady) {
      setErrMsg('Nhập đủ người nhận, số điện thoại và địa chỉ nhé.');
      return;
    }
    // Không có mã quận/phường GHN thì server không tính được phí và đơn lên
    // với phí ship 0đ. Bắt sửa địa chỉ trước khi cho đặt.
    if (!ghnReady) {
      setErrMsg('Địa chỉ này chưa có quận/phường theo GHN nên chưa tính được phí ship. Sửa địa chỉ rồi đặt lại nhé.');
      return;
    }
    if (walletShort) {
      setErrMsg('Ví không đủ tiền cho đơn này. Nạp thêm hoặc chọn trả khi nhận hàng nhé.');
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
    // Từ đây giỏ có thể bị làm rỗng (đơn đã tạo) trước khi trang PayOS kịp mở.
    if (payment === 'payos') setPayosOpening(true);
    create.mutate({ dto, idempotencyKey: idempotencyKey.current ?? undefined }, {
      onSuccess: (created) => {
        if (payment === 'wallet') void payWithWallet(created);
        else if (payment === 'payos') void payWithPayos(created);
        else router.replace('/orders');
      },
      onError: (e) => {
        setPayosOpening(false);
        const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
        setErrMsg(Array.isArray(msg) ? String(msg[0]) : typeof msg === 'string' ? msg : 'Đặt hàng chưa được. Thử lại nhé.');
      },
    });
  };

  // POST /orders với 'wallet' chỉ TẠO đơn, chưa trừ tiền: phải gọi tiếp
  // POST /payments cho từng đơn. Trước đây app dừng ở bước tạo đơn rồi báo
  // thành công, ví không bị trừ đồng nào.
  const payWithWallet = async (created: Order | Order[]) => {
    const orders = Array.isArray(created) ? created : [created];
    let failed: { order: Order; message: string } | null = null;
    for (const o of orders) {
      try {
        await pay.mutateAsync(o.id);
      } catch (e) {
        failed ??= { order: o, message: apiErrorMessage(e, 'Chưa trừ được tiền trong ví.') };
      }
    }
    if (!failed) {
      router.replace('/orders');
      return;
    }
    // Đơn đã có nhưng chưa trả: đưa tới chi tiết đơn (nơi trả lại được), không
    // phải màn thành công.
    router.replace({ pathname: '/orders/[id]', params: { id: String(failed.order.id) } });
    Alert.alert(
      'Đơn đã tạo nhưng chưa thanh toán',
      `${failed.message}\n\nĐơn vẫn được giữ. Nạp thêm ví rồi bấm "Trả bằng ví" trong chi tiết đơn, hoặc huỷ đơn nếu không mua nữa.`,
    );
  };

  /**
   * PayOS: đơn phải có trước mới tạo được link, nên mở luôn trang thanh toán
   * (mã VietQR + số tài khoản) TRONG app sau khi tạo — không nhảy sang trình
   * duyệt. Giỏ có món của nhiều người bán thì tách thành nhiều đơn, mỗi đơn một
   * link: trả đơn đầu, còn lại trả tiếp trong "Đơn mua" để không mở một loạt
   * trang thanh toán.
   */
  const payWithPayos = async (created: Order | Order[]) => {
    const orders = Array.isArray(created) ? created : [created];
    const first = orders[0];
    const others = orders.length - 1;
    let url: string | null = null;
    let linkError: string | null = null;
    try {
      url = await orderPayosUrl(first.id);
    } catch (e) {
      // Đơn ĐÃ tạo: không được báo như đặt hàng thất bại.
      linkError = apiErrorMessage(e, 'Không lấy được link thanh toán PayOS.');
    }
    if (linkError) {
      Alert.alert(
        'Đơn đã tạo nhưng chưa mở được trang thanh toán',
        `${linkError}\n\nĐơn nằm trong "Đơn mua" — bấm "Thanh toán bằng PayOS" để mở lại.`,
      );
    } else if (others > 0) {
      Alert.alert(
        `Còn ${others} đơn chưa trả`,
        'Giỏ có món từ nhiều người bán nên tách thành nhiều đơn, mỗi đơn trả một lần. Mở từng đơn trong "Đơn mua" để trả tiếp.',
      );
    }
    // Giỏ đã chốt nên màn checkout thành vô dụng: trang PayOS thay chỗ nó, đóng
    // thì về chi tiết đơn. Không có link thì về chi tiết đơn để trả lại từ đó.
    if (url) openPayosWeb({ url, kind: 'order', orderId: first.id, mode: 'replace' });
    else router.replace({ pathname: '/orders/[id]', params: { id: String(first.id) } });
  };

  const header = (
    <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
      <BackChevron tone="light" onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart'))} />
      <Text variant="title">Thanh toán</Text>
    </View>
  );

  // Đặt xong giỏ được làm mới nên `items` rỗng trong lúc còn trừ ví hoặc còn
  // xin link PayOS: giữ vòng chờ thay vì nháy màn "Chưa có món" (màn đó chỉ
  // đúng khi giỏ thật sự trống).
  if (isPending || (busy && items.length === 0)) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.brand} />
          {payosOpening && items.length === 0 ? (
            <Text variant="bodyMuted" style={styles.centerText}>
              Đang mở trang thanh toán PayOS…
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading">{soldOutCount > 0 ? 'Món đã hết hàng' : 'Chưa có món để thanh toán'}</Text>
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
      <KeyboardAwareScrollView
        bottomOffset={KEYBOARD_GAP}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Giao tới — luôn từ sổ địa chỉ (như Amazon/eBay/Etsy): bấm để chọn hoặc
            thêm mới; địa chỉ nhập ở form Thêm-địa-chỉ được LƯU lại cho lần sau. */}
        <Pressable
          style={styles.card}
          onPress={() => (hasSaved ? setPickerOpen(true) : router.push('/addresses/new'))}>
          <View style={styles.addrRow}>
            <Feather name="map-pin" size={18} color={Palette.brand} style={styles.addrPin} />
            {hasSaved && addressReady ? (
              <View style={styles.addrBody}>
                <View style={styles.addrTop}>
                  <Text variant="subheading" numberOfLines={1} style={styles.addrName}>{address.receiver_name}</Text>
                  <Text variant="bodyMuted" style={styles.addrPhone}>{address.receiver_phone}</Text>
                </View>
                <Text variant="bodyMuted" style={styles.addrLine}>{address.shipping_address}</Text>
                {!ghnReady ? (
                  <>
                    <Text variant="caption" style={styles.warn}>
                      Địa chỉ này thiếu quận/phường theo GHN nên chưa tính được phí ship. Sửa lại địa
                      chỉ (chọn quận, phường) hoặc chọn địa chỉ khác để đặt hàng.
                    </Text>
                    {selectedId !== null ? (
                      <Pressable
                        hitSlop={8}
                        style={styles.fixAddr}
                        onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: selectedId } })}
                        accessibilityRole="button">
                        <Feather name="edit-2" size={13} color={Palette.brand} />
                        <Text style={styles.pickEditText}>Sửa địa chỉ này</Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : (
              <View style={styles.addrBody}>
                <Text variant="subheading">
                  {hasSaved ? 'Chọn địa chỉ giao hàng' : 'Thêm địa chỉ giao hàng'}
                </Text>
                <Text variant="caption" style={styles.addrHint}>
                  {hasSaved ? 'Chạm để chọn từ sổ địa chỉ.' : 'Chạm để nhập — sẽ được lưu cho lần sau.'}
                </Text>
              </View>
            )}
            <Feather name="chevron-right" size={18} color={Palette.inkFaint} />
          </View>
        </Pressable>

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
          {soldOutCount > 0 ? (
            <Text variant="caption" style={[styles.warn, styles.soldOutNote]}>
              {soldOutCount} món trong giỏ đã hết hàng nên không có trong đơn này.
            </Text>
          ) : null}
          <View style={styles.itemList}>
            {items.map((it) => {
              return (
                <View key={it.id} style={styles.itemRow}>
                  <View style={styles.itemThumb}>
                    <RemoteImage path={it.product?.image} thumb style={styles.itemThumbImg} contentFit="cover" />
                  </View>
                  <View style={styles.itemBody}>
                    <Text variant="body" numberOfLines={2}>{it.product?.name}</Text>
                    <Text variant="caption">
                      {formatVnd(it.product?.price, it.product?.currency)}
                      {it.quantity > 1 ? ` × ${it.quantity}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatVnd(Number(it.product?.price ?? 0) * (it.quantity ?? 1), it.product?.currency)}
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
                    <Text variant="caption">
                      {opt.value === 'wallet' && wallet.data
                        ? `Số dư: ${formatVnd(wallet.data.balance, currency)}`
                        : opt.desc}
                    </Text>
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
            <Text style={styles.sumValue}>{formatVnd(subtotal, currency)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text variant="bodyMuted">Phí vận chuyển</Text>
            <Text style={styles.sumValue}>
              {!ghnReady ? 'Chọn địa chỉ' : quote.isPending ? 'Đang tính…' : feeError ? 'Chưa tính được' : shippingFee === 0 ? 'Miễn phí' : formatVnd(shippingFee, currency)}
            </Text>
          </View>

          {/* Phí ship tách theo từng người bán (GHN mỗi shop gửi riêng). */}
          {quote.data && quote.data.items.length > 1 ? (
            <View style={styles.byShop}>
              <Text variant="caption" style={styles.byShopHead}>Phí ship theo người bán</Text>
              {quote.data.items.map((s) => (
                <View key={s.seller_id} style={styles.byShopRow}>
                  <Text variant="caption" numberOfLines={1} style={styles.byShopName}>{s.seller_name}</Text>
                  <Text variant="caption">{s.error ? 'Chưa tính được' : s.fee === 0 ? 'Miễn phí' : formatVnd(s.fee)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {quote.data?.items.some((s) => !s.has_pickup) ? (
            <Text variant="caption" style={styles.warn}>
              Một số người bán chưa cài địa chỉ lấy hàng. Phí có thể được tính lại khi xử lý đơn.
            </Text>
          ) : null}
          {feeError && ghnReady && !quote.isPending ? (
            <View style={styles.feeErrBox}>
              <Text variant="caption" style={styles.errText}>{feeError}</Text>
              {failingIsMyShop ? (
                <Text variant="caption" style={styles.errText}>
                  Đơn này có món của shop bạn: địa chỉ LẤY hàng của shop cũng phải chọn lại theo
                  danh mục GHN mới (Cài đặt shop → địa chỉ lấy hàng).
                </Text>
              ) : noRoute ? (
                <Text variant="caption" style={styles.errText}>
                  Mã quận/huyện hoặc phường/xã có thể đã đổi sau sáp nhập. Chọn lại địa chỉ nhận;
                  nếu vẫn lỗi thì người bán cần cập nhật địa chỉ lấy hàng của shop.
                </Text>
              ) : null}
              <View style={styles.feeErrActions}>
                <Pressable hitSlop={8} style={styles.fixAddr} onPress={retryQuote} accessibilityRole="button">
                  <Feather name="refresh-cw" size={13} color={Palette.brand} />
                  <Text style={styles.pickEditText}>Thử lại</Text>
                </Pressable>
                {selectedId !== null ? (
                  <Pressable
                    hitSlop={8}
                    style={styles.fixAddr}
                    onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: selectedId } })}
                    accessibilityRole="button">
                    <Feather name="edit-2" size={13} color={Palette.brand} />
                    <Text style={styles.pickEditText}>Sửa địa chỉ nhận</Text>
                  </Pressable>
                ) : null}
                {failingIsMyShop ? (
                  <Pressable
                    hitSlop={8}
                    style={styles.fixAddr}
                    onPress={() => router.push('/shop/settings')}
                    accessibilityRole="button">
                    <Feather name="home" size={13} color={Palette.brand} />
                    <Text style={styles.pickEditText}>Sửa địa chỉ lấy hàng</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
          {walletShort && wallet.data ? (
            <Text variant="caption" style={[styles.errText, styles.walletShort]}>
              Ví còn {formatVnd(wallet.data.balance, currency)}, thiếu {formatVnd(grandTotal - wallet.data.balance, currency)}. Nạp thêm hoặc chọn trả khi nhận hàng nhé.
            </Text>
          ) : null}
        </View>

        {errMsg ? (
          <View style={styles.errBox}>
            <Text variant="caption" style={styles.errText}>{errMsg}</Text>
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      {/* Bảng chọn địa chỉ đã lưu */}
      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text variant="heading">Chọn địa chỉ</Text>
            <Pressable hitSlop={8} onPress={() => setPickerOpen(false)} accessibilityLabel="Đóng">
              <Ionicons name="close" size={22} color={Palette.inkMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.sheetList} contentContainerStyle={styles.sheetListInner}>
            {addresses.map((a) => {
              const on = a.id === selectedId;
              return (
                <View key={a.id} style={[styles.pickRow, on && styles.pickRowOn]}>
                  <Pressable
                    style={styles.pickMain}
                    onPress={() => { setSelectedId(a.id); setPickerOpen(false); }}>
                    <Ionicons
                      name={on ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={on ? Palette.brand : Palette.inkFaint}
                      style={styles.pickRadio}
                    />
                    <View style={styles.pickInfo}>
                      <View style={styles.pickTop}>
                        <Text variant="subheading" numberOfLines={1} style={styles.pickName}>{a.recipient_name}</Text>
                        <Text variant="bodyMuted" style={styles.pickPhone}>{a.phone_number}</Text>
                        {a.is_default ? (
                          <View style={styles.pickDefaultTag}>
                            <Text style={styles.pickDefaultText}>Mặc định</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text variant="bodyMuted" style={styles.pickAddr}>
                        {[a.street, a.ward, a.district, a.province].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    hitSlop={6}
                    style={styles.pickEdit}
                    onPress={() => { setPickerOpen(false); router.push({ pathname: '/addresses/[id]', params: { id: a.id } }); }}
                    accessibilityLabel={`Sửa địa chỉ của ${a.recipient_name}`}>
                    <Feather name="edit-2" size={13} color={Palette.brand} />
                    <Text style={styles.pickEditText}>Sửa</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.sheetFooter}>
            <Button
              title="Thêm địa chỉ mới"
              variant="secondary"
              onPress={() => { setPickerOpen(false); router.push('/addresses/new'); }}
            />
          </View>
      </BottomSheet>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.totalRow}>
          <Text variant="bodyMuted">Tổng thanh toán</Text>
          <Text style={styles.total}>{formatVnd(grandTotal, currency)}</Text>
        </View>
        <Button
          title={pay.isPending ? 'Đang trừ ví…' : create.isPending ? 'Đang đặt…' : 'Đặt hàng'}
          onPress={onSubmit}
          loading={submitting}
          disabled={!addressReady || !ghnReady || submitting || !!feeError || walletShort}
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
  centerText: { textAlign: 'center' },
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
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addrPin: { marginTop: 2, alignSelf: 'flex-start' },
  addrBody: { flex: 1, gap: 3 },
  addrTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  addrName: { flexShrink: 1 },
  addrPhone: {},
  addrLine: { color: Palette.ink },
  addrHint: { color: Palette.inkFaint },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    maxHeight: '75%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  sheetList: { paddingHorizontal: 16 },
  sheetListInner: { paddingVertical: 12, gap: 10 },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
    paddingRight: 8,
  },
  pickRowOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  pickMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12 },
  pickRadio: { marginTop: 1 },
  pickInfo: { flex: 1, gap: 3 },
  pickTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  pickName: { flexShrink: 1 },
  pickPhone: {},
  pickAddr: {},
  pickDefaultTag: {
    backgroundColor: Palette.brand,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pickDefaultText: { fontFamily: Font.semibold, fontSize: 10.5, color: Palette.white },
  pickEdit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 12 },
  pickEditText: { fontFamily: Font.semibold, fontSize: 12.5, color: Palette.brand },
  fixAddr: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6 },
  feeErrBox: { marginTop: 8, gap: 4 },
  feeErrActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  sheetFooter: { padding: 16, borderTopWidth: 1, borderTopColor: Palette.line },
  noteHead: { marginBottom: 12 },
  soldOutNote: { marginTop: -4, marginBottom: 12 },
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
  walletShort: { marginTop: 8 },
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
