import { Palette } from '@/components/ui/theme';
import type { Order } from '@/api';

export type OrderStatus = Order['status'];

/** Nhãn + màu badge theo trạng thái đơn (đồng bộ với backend enum). */
export const STATUS_META: Record<OrderStatus, { label: string; fg: string; bg: string }> = {
  pending: { label: 'Chờ xác nhận', fg: Palette.pendingFg, bg: Palette.pendingBg },
  confirmed: { label: 'Đã xác nhận', fg: Palette.progressFg, bg: Palette.progressBg },
  processing: { label: 'Đang chuẩn bị', fg: Palette.progressFg, bg: Palette.progressBg },
  shipping: { label: 'Đang giao', fg: Palette.progressFg, bg: Palette.progressBg },
  delivered: { label: 'Đã nhận', fg: Palette.successFg, bg: Palette.successBg },
  cancelled: { label: 'Đã huỷ', fg: Palette.neutralFg, bg: Palette.neutralBg },
  refunded: { label: 'Đã hoàn tiền', fg: Palette.neutralFg, bg: Palette.neutralBg },
};

/** Các tab lọc đơn — mỗi tab gom vài trạng thái cho gọn. */
export interface OrderTab {
  key: string;
  label: string;
  match: (s: OrderStatus) => boolean;
}
export const ORDER_TABS: OrderTab[] = [
  { key: 'all', label: 'Tất cả', match: () => true },
  { key: 'pending', label: 'Chờ xử lý', match: (s) => s === 'pending' || s === 'confirmed' || s === 'processing' },
  { key: 'shipping', label: 'Đang giao', match: (s) => s === 'shipping' },
  { key: 'delivered', label: 'Đã nhận', match: (s) => s === 'delivered' },
  { key: 'cancelled', label: 'Đã huỷ', match: (s) => s === 'cancelled' || s === 'refunded' },
];
