import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import {
  useCancelSale,
  useConfirmSale,
  useOrder,
  useRetryShipments,
  useSimulatePickup,
  type OrderShipment,
} from '@/features/orders/api';
import { STATUS_META } from '@/features/orders/order-status';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import type { Order } from '@/api';

/** Một câu nói người bán cần làm gì tiếp, theo trạng thái đơn + vận đơn. */
function nextStep(status: Order['status'], shipment?: OrderShipment): string {
  if (status === 'pending') {
    return 'Người mua đang chờ bạn xác nhận. Xác nhận xong, hệ thống tạo vận đơn GHN để shipper tới lấy hàng.';
  }
  if (status === 'confirmed' || status === 'processing') {
    if (shipment?.status === 'failed') return 'GHN chưa nhận vận đơn này. Xem lý do bên dưới rồi tạo lại.';
    if (shipment?.tracking_code) return 'Đóng gói và chờ GHN tới lấy hàng.';
    return 'Đơn đã xác nhận nhưng chưa có vận đơn GHN.';
  }
  if (status === 'shipping') return 'GHN đang giao. Tiền hàng về ví khi người mua xác nhận đã nhận.';
  if (status === 'delivered') return 'Người mua đã nhận hàng.';
  return 'Đơn đã huỷ, hàng đã trả lại kho.';
}

/**
 * Chi tiết một đơn bán (lỗi H-02 test E2E 30/09). Ba trục tách riêng như sàn
 * thật: trạng thái đơn, thanh toán, và vận đơn GHN của riêng người bán này.
 * Vận đơn lỗi luôn đi kèm nút tạo lại, không để người bán kẹt.
 */
export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user?.id);
  const { data: order, isPending, isError, refetch } = useOrder(orderId);
  const confirm = useConfirmSale();
  const cancel = useCancelSale();
  const retry = useRetryShipments();
  const pickup = useSimulatePickup();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/sales' as Href));
  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <BackChevron tone="light" onPress={back} />
      <Text variant="title">Đơn bán</Text>
    </View>
  );

  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
      </View>
    );
  }
  if (isError || !order) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading">Không tải được đơn</Text>
          <View style={styles.cta}><Button title="Thử lại" onPress={() => refetch()} /></View>
        </View>
      </View>
    );
  }

  // Đơn nhiều người bán: chỉ hiện món và vận đơn của mình. Món thiếu thông tin
  // người bán (sản phẩm đã xoá) thì vẫn hiện, để không mất dòng nào.
  const allItems = order.items ?? [];
  const mine = allItems.filter((i) => !i.product?.seller?.id || i.product.seller.id === me);
  const items = mine.length > 0 ? mine : allItems;
  const myAmount = items.reduce((s, i) => s + Number(i.subtotal ?? 0), 0);
  const shipment = order.shipments?.find((s) => s.seller?.id === me) ?? order.shipments?.[0];
  const meta = STATUS_META[order.status];
  const busy = confirm.isPending || cancel.isPending || retry.isPending || pickup.isPending;

  const canConfirm = order.status === 'pending';
  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  // Tạo lại vận đơn / giả lập lấy hàng chỉ có nghĩa khi đơn còn chờ gửi; đơn
  // đã huỷ vẫn giữ dòng vận đơn lỗi để biết vì sao, nhưng không còn nút.
  const awaitingShipment = order.status === 'confirmed' || order.status === 'processing';
  const shipFailed = shipment?.status === 'failed';
  const canRetry = awaitingShipment && shipFailed;
  const canPickup = awaitingShipment && shipment?.status === 'created';

  // Huỷ không hoàn tác được: hỏi lại trước (cùng lý do với lỗi M-04 bên người mua).
  const askCancel = () =>
    Alert.alert('Huỷ đơn này?', 'Hàng được trả lại kho và không hoàn tác được.', [
      { text: 'Không huỷ', style: 'cancel' },
      { text: 'Huỷ đơn', style: 'destructive', onPress: () => cancel.mutate(order.id) },
    ]);

  return (
    <View style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.codeRow}>
            <Text variant="caption" style={styles.code} selectable>#{order.order_code}</Text>
            <View style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.badgeText, { color: meta.fg }]}>{meta.label}</Text>
            </View>
          </View>
          <Text variant="body">{nextStep(order.status, shipment)}</Text>

          {shipment ? (
            <View style={styles.shipRow}>
              <Ionicons
                name={shipFailed ? 'alert-circle-outline' : 'cube-outline'}
                size={16}
                color={shipFailed ? Palette.dangerFg : Palette.inkMuted}
              />
              {shipFailed ? (
                <Text variant="caption" style={styles.shipFailText}>
                  Vận đơn GHN lỗi{shipment.error ? `: ${shipment.error}` : ''}
                </Text>
              ) : (
                <Text variant="caption" selectable>
                  Vận đơn GHN {shipment.tracking_code ?? 'chưa có mã'}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text variant="heading" style={styles.h}>Giao tới</Text>
          <Text variant="subheading">{order.receiver_name} · {order.receiver_phone}</Text>
          <Text variant="bodyMuted" style={styles.addr}>{order.shipping_address}</Text>
          {order.note ? (
            <View style={styles.note}>
              <Text variant="caption" style={styles.noteLabel}>Lời nhắn của người mua</Text>
              <Text variant="body">{order.note}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text variant="heading" style={styles.h}>
            {items.length < allItems.length ? `${items.length} món của bạn` : `${items.length} món`}
          </Text>
          <View style={styles.items}>
            {items.map((it) => {
              const uri = mediaUrl(it.product_image);
              return (
                <View key={it.id} style={styles.itemRow}>
                  <View style={styles.thumb}>
                    {uri ? <Image source={uri} style={styles.thumbImg} contentFit="cover" /> : null}
                  </View>
                  <View style={styles.itemBody}>
                    <Text variant="body" numberOfLines={2}>{it.product_name}</Text>
                    <Text variant="caption">
                      {formatVnd(it.price)}
                      {it.quantity > 1 ? ` × ${it.quantity}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>{formatVnd(it.subtotal)}</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.sumRow, styles.sumTotal]}>
            <Text variant="subheading">
              {order.payment_method === 'cod' ? 'GHN thu hộ khi giao' : 'Người mua đã trả qua app'}
            </Text>
            <Text style={styles.total}>{formatVnd(myAmount)}</Text>
          </View>
        </View>

        {canConfirm || canCancel || canRetry || canPickup ? (
          <View style={styles.actions}>
            {canConfirm ? (
              <Button
                title="Xác nhận đơn"
                onPress={() => confirm.mutate(order.id)}
                loading={confirm.isPending}
                disabled={busy}
              />
            ) : null}
            {canRetry ? (
              <Button
                title="Tạo lại vận đơn"
                onPress={() => retry.mutate(order.id)}
                loading={retry.isPending}
                disabled={busy}
              />
            ) : null}
            {canPickup ? (
              <Button
                title="Giả lập GHN lấy hàng (sandbox)"
                variant="secondary"
                onPress={() => pickup.mutate(order.id)}
                loading={pickup.isPending}
                disabled={busy}
              />
            ) : null}
            {canCancel ? (
              <Button title="Huỷ đơn" variant="ghost" onPress={askCancel} disabled={busy} />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  cta: { alignSelf: 'stretch', paddingHorizontal: 24 },
  body: { padding: 12, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 14,
  },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  code: { fontFamily: Font.semibold, color: Palette.inkMuted, fontVariant: ['tabular-nums'] },
  badge: { borderRadius: Radius.control, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: Font.semibold, fontSize: 11.5 },
  shipRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  shipFailText: { flex: 1, color: Palette.dangerFg },
  h: { marginBottom: 10 },
  addr: { marginTop: 4 },
  note: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Palette.line, gap: 2 },
  noteLabel: { fontFamily: Font.semibold },
  items: { gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: Radius.control, backgroundColor: Palette.surfaceSunken, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  itemBody: { flex: 1, gap: 2 },
  itemTotal: { fontFamily: Font.bold, fontSize: 14, color: Palette.price, fontVariant: ['tabular-nums'] },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  sumTotal: { borderTopWidth: 1, borderTopColor: Palette.line, marginTop: 12, paddingTop: 10 },
  total: { fontFamily: Font.extrabold, fontSize: 18, color: Palette.price, fontVariant: ['tabular-nums'] },
  actions: { gap: 10 },
});
