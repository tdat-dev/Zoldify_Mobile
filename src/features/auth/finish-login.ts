import { router } from 'expo-router';

import { takePendingAuthAction } from '@/features/auth/pending-action';
import { cartKeys, postAddToCart, postBuyNow } from '@/features/cart/api';
import { queryClient } from '@/lib/api/query-client';

/**
 * Chốt luồng đăng nhập thành công (M-01).
 *
 * Mặc định cũ luôn `router.replace('/')` — về trang chủ, bỏ hành động khách
 * vừa bấm. Giờ: có hành động đang chờ thì chạy tiếp (thêm vào giỏ / mua ngay)
 * rồi quay lại ĐÚNG món sản phẩm với cờ kết quả; không có thì về "/" như cũ.
 *
 * Gọi sau `authStore.signIn()` — token đã lưu nên POST /cart nhận được phiên
 * mới. Một mình hàm này `take` hành động đang chờ, không màn nào khác.
 */
export async function finishLogin(): Promise<void> {
  const pending = takePendingAuthAction();

  if (!pending) {
    router.replace('/');
    return;
  }

  const id = String(pending.productId);
  // Về đúng món: client thấy "Đã thêm ✓" (added) hoặc lỗi để bấm lại (addError).
  const goProduct = (params: Record<string, string>) =>
    router.replace({ pathname: '/products/[id]', params: { id, ...params } });
  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: cartKeys.all });

  if (pending.kind === 'addToCart') {
    try {
      await postAddToCart({ product_id: pending.productId, quantity: pending.quantity });
      await invalidateCart();
      goProduct({ added: '1' });
    } catch {
      // Món có thể đã hết kho/ngừng đăng bán: về đúng món để người dùng thấy
      // và bấm lại, thay vì lạc về trang chủ với giỏ trống.
      goProduct({ addError: '1' });
    }
    return;
  }

  // Mua ngay: đúng dòng giỏ rồi vào thẳng thanh toán (giống nút khi đã đăng nhập).
  try {
    const item = await postBuyNow({ product_id: pending.productId, quantity: pending.quantity });
    await invalidateCart();
    router.replace({ pathname: '/checkout', params: { only: String(item.id) } });
  } catch {
    goProduct({ addError: '1' });
  }
}
