import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useCancelOrder, useConfirmReceived, useOrder } from '@/features/orders/api';
import { useMyReviewedProducts } from '@/features/reviews/api';
import { STATUS_META, type OrderStatus } from '@/features/orders/order-status';
import { formatVnd } from '@/lib/format';
import { mediaUrl } from '@/lib/media';

// Các mốc theo dõi cho đơn bình thường (đơn huỷ hiển thị riêng).
const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Đặt hàng' },
  { key: 'confirmed', label: 'Xác nhận' },
  { key: 'processing', label: 'Chuẩn bị' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã nhận' },
];

function Timeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'refunded') {
    return (
      <View style={styles.cancelled}>
        <Ionicons name="close-circle" size={20} color={Palette.neutralFg} />
        <Text variant="subheading" style={{ color: Palette.neutralFg }}>{STATUS_META[status].label}</Text>
      </View>
    );
  }
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <View style={styles.timeline}>
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <View key={s.key} style={styles.step}>
            <View style={styles.stepMark}>
              <View style={[styles.dot, done && styles.dotOn]}>
                {done ? <Ionicons name="checkmark" size={12} color={Palette.white} /> : null}
              </View>
              {i < STEPS.length - 1 ? <View style={[styles.line, i < current && styles.lineOn]} /> : null}
            </View>
            <Text variant="caption" style={[styles.stepLabel, done && styles.stepLabelOn]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Chi tiết đơn: trạng thái (timeline), địa chỉ, món, tổng tiền, hành động. */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: order, isPending, isError, refetch } = useOrder(Number(id));
  const cancel = useCancelOrder();
  const confirm = useConfirmReceived();
  // Món nào đã đánh giá: hỏi server (trước đây nhớ trên máy, lỗi H-01).
  const { data: reviewedSet } = useMyReviewedProducts();

  // Làm mới khi mở lại — trạng thái/timeline do người bán đổi ở server.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/orders'));

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <BackChevron tone="light" onPress={back} />
      <Text variant="title">Chi tiết đơn</Text>
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

  const items = order.items ?? [];
  const sellerIds = [...new Set(items.map((i) => i.product?.seller?.id).filter(Boolean))] as number[];
  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canReceive = order.status === 'shipping';
  const canReview = order.status === 'delivered';
  // Vận đơn GHN bị từ chối: nói rõ cho người mua thay vì để đơn nằm im ở "Đã
  // xác nhận" (lỗi H-08 test E2E, đơn ORD-20260930-785). Chỉ khi đơn còn chờ
  // gửi: đơn đã huỷ mà vẫn hứa "sẽ được giao" là nói sai (thấy khi test 05/10).
  const awaitingShipment = order.status === 'confirmed' || order.status === 'processing';
  const failedShipment = awaitingShipment
    ? order.shipments?.find((s) => s.status === 'failed')
    : undefined;

  const onReceive = () => {
    sellerIds.forEach((sid) => confirm.mutate({ orderId: order.id, sellerId: sid }));
  };

  return (
    <View style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.codeRow}>
            <Text variant="caption" style={styles.code}>#{order.order_code}</Text>
            {order.tracking_code ? <Text variant="caption">Vận đơn: {order.tracking_code}</Text> : null}
          </View>
          <Timeline status={order.status} />
          {failedShipment ? (
            <View style={styles.shipFail}>
              <Ionicons name="alert-circle-outline" size={16} color={Palette.dangerFg} />
              <Text variant="caption" style={styles.shipFailText}>
                Người bán chưa tạo được vận đơn GHN
                {failedShipment.error ? `: ${failedShipment.error}` : ''}. Đơn sẽ được giao khi
                người bán tạo lại vận đơn.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text variant="heading" style={styles.h}>Giao tới</Text>
          <Text variant="subheading">{order.receiver_name} · {order.receiver_phone}</Text>
          <Text variant="bodyMuted" style={styles.addr}>{order.shipping_address}</Text>
        </View>

        <View style={styles.card}>
          <Text variant="heading" style={styles.h}>{items.length} món</Text>
          <View style={styles.items}>
            {items.map((it) => {
              const uri = mediaUrl(it.product_image);
              const pid = it.product?.id;
              const reviewed = pid ? (reviewedSet?.has(pid) ?? false) : false;
              return (
                <View key={it.id} style={styles.itemGroup}>
                  <View style={styles.itemRow}>
                    <View style={styles.thumb}>
                      {uri ? <Image source={uri} style={styles.thumbImg} contentFit="cover" /> : null}
                    </View>
                    <View style={styles.itemBody}>
                      <Text variant="body" numberOfLines={2}>{it.product_name}</Text>
                      <Text variant="caption">{formatVnd(it.price)}{it.quantity > 1 ? ` × ${it.quantity}` : ''}</Text>
                    </View>
                    <Text style={styles.itemTotal}>{formatVnd(it.subtotal)}</Text>
                  </View>
                  {canReview && pid ? (
                    reviewed ? (
                      <View style={styles.reviewedTag}>
                        <Ionicons name="checkmark-circle" size={14} color={Palette.successFg} />
                        <Text style={styles.reviewedText}>Đã đánh giá</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.reviewBtn}
                        onPress={() =>
                          router.push({ pathname: '/write-review/[id]', params: { id: pid, orderId: order.id } })
                        }>
                        <Ionicons name="star-outline" size={14} color={Palette.brand} />
                        <Text style={styles.reviewBtnText}>Đánh giá</Text>
                      </Pressable>
                    )
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sumRow}>
            <Text variant="bodyMuted">Tiền hàng</Text>
            <Text style={styles.sumV}>{formatVnd(order.total_amount)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text variant="bodyMuted">Phí vận chuyển</Text>
            <Text style={styles.sumV}>{order.shipping_fee === 0 ? 'Miễn phí' : formatVnd(order.shipping_fee)}</Text>
          </View>
          {order.discount_amount > 0 ? (
            <View style={styles.sumRow}>
              <Text variant="bodyMuted">Giảm giá</Text>
              <Text style={styles.sumV}>-{formatVnd(order.discount_amount)}</Text>
            </View>
          ) : null}
          <View style={[styles.sumRow, styles.sumTotal]}>
            <Text variant="subheading">Tổng cộng</Text>
            <Text style={styles.total}>{formatVnd(order.final_amount)}</Text>
          </View>
        </View>

        {canReceive || canCancel ? (
          <View style={styles.actions}>
            {canReceive ? (
              <Button
                title={confirm.isPending ? 'Đang xác nhận…' : 'Đã nhận hàng'}
                onPress={onReceive}
                loading={confirm.isPending}
              />
            ) : null}
            {canCancel ? (
              <Button
                title={cancel.isPending ? 'Đang huỷ…' : 'Huỷ đơn'}
                variant="secondary"
                onPress={() => cancel.mutate(order.id)}
                loading={cancel.isPending}
              />
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
  body: { padding: 12, gap: 12 },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 14,
  },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  code: { fontFamily: Font.semibold, color: Palette.inkMuted },
  shipFail: { flexDirection: 'row', gap: 6, marginTop: 12, alignItems: 'flex-start' },
  shipFailText: { flex: 1, color: Palette.dangerFg },
  h: { marginBottom: 10 },
  addr: { marginTop: 4 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center' },
  stepMark: { width: '100%', alignItems: 'center' },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotOn: { backgroundColor: Palette.brand, borderColor: Palette.brand },
  line: { position: 'absolute', top: 10, left: '50%', right: '-50%', height: 2, backgroundColor: Palette.lineStrong },
  lineOn: { backgroundColor: Palette.brand },
  stepLabel: { marginTop: 6, textAlign: 'center', fontSize: 10.5 },
  stepLabelOn: { color: Palette.brand, fontFamily: Font.semibold },
  cancelled: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  items: { gap: 12 },
  itemGroup: { gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.brand,
    marginLeft: 64,
  },
  reviewBtnText: { fontFamily: Font.semibold, fontSize: 12.5, color: Palette.brand },
  reviewedTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 64 },
  reviewedText: { fontFamily: Font.medium, fontSize: 12.5, color: Palette.successFg },
  thumb: { width: 52, height: 52, borderRadius: Radius.control, backgroundColor: Palette.surfaceSunken, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  itemBody: { flex: 1, gap: 2 },
  itemTotal: { fontFamily: Font.bold, fontSize: 14, color: Palette.price, fontVariant: ['tabular-nums'] },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sumV: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, fontVariant: ['tabular-nums'] },
  sumTotal: { borderTopWidth: 1, borderTopColor: Palette.line, marginTop: 6, paddingTop: 10 },
  total: { fontFamily: Font.extrabold, fontSize: 18, color: Palette.price, fontVariant: ['tabular-nums'] },
  actions: { gap: 10 },
});
