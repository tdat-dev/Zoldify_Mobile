import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, Paginated } from '@/api';
import { useAuthStore } from '@/features/auth/store';
import { walletKeys } from '@/features/orders/api';

/**
 * Ví Zoldify trên app (trước đây lối tắt "Ví của tôi" trỏ sang /account, nơi
 * không có gì về ví: bấm vào không thấy gì, 28/10). Cùng API với trang ví web
 * (Zoldify_Frontend/src/app/profile/wallet/page.tsx):
 *  - số dư: GET /payments/wallet/balance (useWalletBalance ở orders/api);
 *  - lịch sử nạp/trả: GET /payments;
 *  - nạp: POST /payos/create-link { type: 'topup', amount } -> checkoutUrl;
 *  - rút: POST /withdrawals, lịch sử rút GET /withdrawals/me.
 */

/** Khớp @Min(10000) của CreateWithdrawalDto và mức nạp tối thiểu trên web. */
export const MIN_TOPUP = 10_000;
export const MIN_WITHDRAW = 10_000;

export interface WalletPayment {
  id: number;
  amount: number | string;
  type: string;
  status: 'pending' | 'success' | 'failed' | string;
  payment_method?: string;
  note?: string | null;
  created_at: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export interface Withdrawal {
  id: number;
  amount: number | string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  status: WithdrawalStatus;
  note?: string | null;
  created_at: string;
}

export const walletListKeys = {
  payments: ['wallet', 'payments'] as const,
  withdrawals: ['wallet', 'withdrawals'] as const,
};

/**
 * Tiền vào hay ra. Backend có HAI bộ từ: payments.type (order_payment,
 * wallet_topup) và wallet_transactions.type (topup, payment, refund,
 * withdrawal). Nhận cả hai như lib/money-flow.ts bên web; kiểu lạ thì hiện
 * nguyên văn, không gán bừa dấu cộng/trừ.
 */
const IN = new Set(['wallet_topup', 'topup', 'refund']);
const OUT = new Set(['order_payment', 'payment', 'withdrawal']);
export function moneyFlow(type: string): 'in' | 'out' | 'unknown' {
  if (IN.has(type)) return 'in';
  if (OUT.has(type)) return 'out';
  return 'unknown';
}
export const MONEY_LABEL: Record<string, string> = {
  wallet_topup: 'Nạp tiền vào ví',
  topup: 'Nạp tiền vào ví',
  order_payment: 'Thanh toán đơn hàng',
  payment: 'Thanh toán đơn hàng',
  refund: 'Hoàn tiền',
  withdrawal: 'Rút tiền',
};

export const WITHDRAWAL_META: Record<WithdrawalStatus, { label: string; tone: 'pending' | 'progress' | 'success' | 'danger' }> = {
  pending: { label: 'Chờ duyệt', tone: 'pending' },
  approved: { label: 'Đã duyệt', tone: 'progress' },
  completed: { label: 'Đã chuyển', tone: 'success' },
  rejected: { label: 'Bị từ chối', tone: 'danger' },
};

function useSignedIn() {
  return useAuthStore((s) => s.status === 'signedIn');
}

export function useWalletPayments() {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: walletListKeys.payments,
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<WalletPayment>>>('/payments', {
        params: { currentPage: 1, limit: 20 },
      });
      return res.data.data?.result ?? [];
    },
    enabled: signedIn,
  });
}

export function useMyWithdrawals() {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: walletListKeys.withdrawals,
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<Withdrawal>>>('/withdrawals/me', {
        params: { page: 1, limit: 20 },
      });
      return res.data.data?.result ?? [];
    },
    enabled: signedIn,
  });
}

/** Tạo link PayOS để nạp ví. Trả về checkoutUrl để mở trình duyệt. */
export function useCreateTopupLink() {
  return useMutation({
    meta: { handlesError: true },
    mutationFn: async (amount: number) => {
      const res = await http.post<ApiResponse<{ checkoutUrl?: string }>>('/payos/create-link', {
        type: 'topup',
        amount,
      });
      const url = res.data.data?.checkoutUrl;
      if (!url) throw new Error('Không tạo được link nạp tiền. Thử lại sau nhé.');
      return url;
    },
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    meta: { handlesError: true },
    mutationFn: async (input: { amount: number; bank_name: string; bank_account: string; bank_holder: string }) => {
      const res = await http.post<ApiResponse<Withdrawal>>('/withdrawals', input);
      return res.data.data;
    },
    // Đọc lại số dư từ server chứ không tự trừ: số thật do sổ cái quyết định.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: walletKeys.balance });
      qc.invalidateQueries({ queryKey: walletListKeys.withdrawals });
    },
  });
}
