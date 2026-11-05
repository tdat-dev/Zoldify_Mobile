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
 *  - lịch sử: GET /wallets/transactions (sổ cái, có cả hoàn tiền và tiền bán).
 *    Trước đây đọc GET /payments nên chỉ thấy khoản trả, không thấy tiền hoàn
 *    escrow_refund hay nạp topup: người dùng tưởng mất tiền (D-19, E2E 02/11);
 *  - nạp: POST /payos/create-link { type: 'topup', amount } -> checkoutUrl;
 *  - rút: POST /withdrawals, lịch sử rút GET /withdrawals/me.
 */

/** Khớp @Min(10000) của CreateWithdrawalDto và mức nạp tối thiểu trên web. */
export const MIN_TOPUP = 10_000;
export const MIN_WITHDRAW = 10_000;

/**
 * Một dòng sổ cái của ví (GET /wallets/transactions). `amount` có dấu: dương là
 * tiền vào ví, âm là tiền ra. `type` là LedgerTxType của backend.
 */
export interface WalletLedgerEntry {
  id: number;
  amount: number;
  balance_after: number;
  type: string;
  reference_type?: string | null;
  reference_id?: number | null;
  order_id?: number | null;
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
  transactions: ['wallet', 'transactions'] as const,
  withdrawals: ['wallet', 'withdrawals'] as const,
};

/** Nhãn cho loại sự kiện sổ cái (LedgerTxType ở backend). */
export const LEDGER_LABEL: Record<string, string> = {
  topup: 'Nạp tiền vào ví',
  order_hold: 'Thanh toán đơn hàng',
  escrow_release: 'Tiền bán hàng',
  escrow_refund: 'Hoàn tiền đơn hàng',
  withdrawal_approve: 'Rút tiền',
  withdrawal_complete: 'Rút tiền',
  adjustment: 'Điều chỉnh số dư',
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

/** Lịch sử ví lấy từ sổ cái: nạp, trả đơn, hoàn tiền, tiền bán, rút. */
export function useWalletTransactions() {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: walletListKeys.transactions,
    queryFn: async () => {
      const res = await http.get<ApiResponse<Paginated<WalletLedgerEntry>>>('/wallets/transactions', {
        params: { page: 1, limit: 20 },
      });
      return (res.data.data?.result ?? []).map((e) => ({ ...e, amount: Number(e.amount) }));
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
