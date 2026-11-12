import { Alert } from 'react-native';

import { Button } from '@/components/ui/button';
import { useChangePaymentMethod, usePayOrderWithWallet } from '@/features/orders/api';
import { apiErrorMessage } from '@/lib/api/error-message';
import type { Order } from '@/api';

type Method = 'cod' | 'wallet';

const LABEL: Record<Method, string> = {
  cod: 'Trả khi nhận hàng (COD)',
  wallet: 'Ví Zoldify',
};

/** Đổi cách trả được khi đơn còn chờ xác nhận và chưa trả (backend cùng luật). */
export function canChangePaymentMethod(order: Order): boolean {
  return order.status === 'pending' && !order.is_paid;
}

/**
 * Nút "Đổi cách trả" cho đơn chưa trả, giống web (#168).
 *
 * Vì sao cần: chọn ví mà thiếu tiền thì đơn nằm chờ, muốn trả khi nhận hàng
 * phải huỷ rồi đặt lại trong khi giỏ đã bị xoá. App chỉ có COD và ví lúc đặt
 * (PayOS cho đơn chỉ có trên web), nên chỉ cho đổi qua lại hai cách này; đơn
 * PayOS đặt từ web vẫn đổi được sang một trong hai.
 *
 * Đổi sang ví thì trừ ví luôn, khỏi phải bấm thêm "Trả bằng ví".
 */
export function ChangePaymentButton({ order }: { order: Order }) {
  const change = useChangePaymentMethod();
  const pay = usePayOrderWithWallet();
  const busy = change.isPending || pay.isPending;

  const apply = (method: Method) => {
    change.mutate(
      { orderId: order.id, method },
      {
        onSuccess: () => {
          if (method === 'cod') {
            Alert.alert('Đã đổi cách trả', 'Bạn trả tiền mặt khi nhận hàng.');
            return;
          }
          pay.mutate(order.id, {
            onSuccess: () => Alert.alert('Đã thanh toán', 'Đã trừ tiền trong ví cho đơn này.'),
            onError: (e) =>
              Alert.alert(
                'Đã đổi sang ví nhưng chưa trừ được tiền',
                apiErrorMessage(e, 'Nạp thêm vào ví rồi bấm "Trả bằng ví".'),
              ),
          });
        },
        onError: (e) => Alert.alert('Chưa đổi được cách trả', apiErrorMessage(e, 'Thử lại sau nhé.')),
      },
    );
  };

  const ask = () => {
    const choices = (Object.keys(LABEL) as Method[]).filter((m) => m !== order.payment_method);
    Alert.alert('Đổi cách trả', `Đang chọn: ${LABEL[order.payment_method as Method] ?? 'PayOS'}`, [
      { text: 'Giữ nguyên', style: 'cancel' },
      ...choices.map((m) => ({ text: LABEL[m], onPress: () => apply(m) })),
    ]);
  };

  return (
    <Button
      title={busy ? 'Đang đổi…' : 'Đổi cách trả'}
      variant="secondary"
      onPress={ask}
      loading={busy}
      disabled={busy}
    />
  );
}
