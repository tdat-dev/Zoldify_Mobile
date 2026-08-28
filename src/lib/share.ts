import { Share } from 'react-native';

import { WEB_ORIGIN } from './config';
import { formatVnd } from './format';

/** Link web storefront của một sản phẩm (mở được trên trình duyệt). */
export function productWebUrl(id: number) {
  return `${WEB_ORIGIN}/product/${id}`;
}

/**
 * Mở share sheet của hệ điều hành cho một sản phẩm — tên + giá + link web để
 * người nhận (dù chưa có app) vẫn xem được. Nuốt lỗi/huỷ (người dùng đóng sheet
 * không phải lỗi). Trả về true nếu chia sẻ thành công.
 */
export async function shareProduct(product: { id: number; name: string; price: number }): Promise<boolean> {
  const url = productWebUrl(product.id);
  try {
    const res = await Share.share({
      title: product.name,
      // Android gộp `message`+`url`; iOS tách `url` riêng nên nhắc lại trong message.
      message: `${product.name} · ${formatVnd(product.price)}\n${url}`,
      url,
    });
    return res.action === Share.sharedAction;
  } catch {
    return false;
  }
}
