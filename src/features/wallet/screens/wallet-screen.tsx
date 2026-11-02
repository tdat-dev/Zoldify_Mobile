import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { KEYBOARD_GAP } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import { useWalletBalance, walletKeys } from '@/features/orders/api';
import { TabPlaceholder } from '@/features/shared/tab-placeholder';
import {
  LEDGER_LABEL,
  MIN_TOPUP,
  MIN_WITHDRAW,
  WITHDRAWAL_META,
  useCreateTopupLink,
  useCreateWithdrawal,
  useMyWithdrawals,
  useWalletTransactions,
  walletListKeys,
} from '@/features/wallet/api';
import { formatVnd } from '@/lib/format';

const QUICK_TOPUP = [50_000, 100_000, 200_000, 500_000];

const TONE = {
  pending: { fg: Palette.pendingFg, bg: Palette.pendingBg },
  progress: { fg: Palette.progressFg, bg: Palette.progressBg },
  success: { fg: Palette.successFg, bg: Palette.successBg },
  danger: { fg: Palette.dangerFg, bg: Palette.dangerBg },
} as const;

/** Chỉ giữ chữ số (người dùng hay gõ "100.000"). */
const digits = (s: string) => s.replace(/\D/g, '');

function errMsg(e: unknown, fallback: string): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(m)) return m[0] ?? fallback;
  if (m) return m;
  return e instanceof Error && e.message ? e.message : fallback;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Ví Zoldify: số dư, nạp (PayOS), rút về ngân hàng, lịch sử.
 *
 * Lối tắt "Ví của tôi" ở trang chủ trước đây trỏ sang /account, nơi không có gì
 * về ví (28/10). Bố cục theo trang ví web: số tiền ĐANG BỊ GIỮ (lệnh rút chờ
 * duyệt) nằm ngay dưới số khả dụng, vì gửi lệnh rút là số khả dụng tụt ngay
 * và người bán cần thấy tiền đi đâu.
 */
export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';

  const balance = useWalletBalance();
  const payments = useWalletTransactions();
  const withdrawals = useMyWithdrawals();
  const topup = useCreateTopupLink();
  const withdraw = useCreateWithdrawal();

  const [panel, setPanel] = useState<'none' | 'topup' | 'withdraw'>('none');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupErr, setTopupErr] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', bank_name: '', bank_account: '', bank_holder: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  if (guest) {
    return <TabPlaceholder title="Ví của tôi" note="Đăng nhập để xem số dư, nạp và rút tiền." />;
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const available = balance.data?.balance ?? 0;
  const held = Number(balance.data?.pending_withdrawal ?? 0);

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: walletKeys.balance });
    qc.invalidateQueries({ queryKey: walletListKeys.transactions });
    qc.invalidateQueries({ queryKey: walletListKeys.withdrawals });
  };

  const onTopup = async () => {
    const amount = Number(digits(topupAmount));
    if (!amount || amount < MIN_TOPUP) {
      setTopupErr(`Nạp tối thiểu ${formatVnd(MIN_TOPUP)}.`);
      return;
    }
    setTopupErr(null);
    try {
      const url = await topup.mutateAsync(amount);
      // Trang PayOS mở trong trình duyệt của app; đóng lại (trả xong hay huỷ)
      // thì đọc lại số dư. Tiền vào ví do webhook PayOS ghi, có thể trễ vài giây.
      await openBrowserAsync(url);
      setTopupAmount('');
      setPanel('none');
      setNotice('Nếu đã thanh toán, số dư sẽ cập nhật trong giây lát. Kéo xuống để làm mới.');
      refreshAll();
    } catch (e) {
      setTopupErr(errMsg(e, 'Không tạo được link nạp tiền. Thử lại sau nhé.'));
    }
  };

  const onWithdraw = async () => {
    const amount = Number(digits(form.amount));
    const next: Record<string, string> = {};
    if (!form.amount.trim()) next.amount = 'Nhập số tiền muốn rút.';
    else if (amount < MIN_WITHDRAW) next.amount = `Rút tối thiểu ${formatVnd(MIN_WITHDRAW)}.`;
    else if (amount > available) next.amount = `Vượt số dư khả dụng ${formatVnd(available)}.`;
    if (!form.bank_name.trim()) next.bank_name = 'Nhập tên ngân hàng.';
    if (!form.bank_account.trim()) next.bank_account = 'Nhập số tài khoản.';
    if (!form.bank_holder.trim()) next.bank_holder = 'Nhập tên chủ tài khoản.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await withdraw.mutateAsync({
        amount,
        bank_name: form.bank_name.trim(),
        bank_account: form.bank_account.trim(),
        bank_holder: form.bank_holder.trim(),
      });
      setForm({ amount: '', bank_name: '', bank_account: '', bank_holder: '' });
      setPanel('none');
      setNotice('Đã gửi lệnh rút. Tiền được giữ lại tới khi Zoldify chuyển khoản.');
    } catch (e) {
      setErrors({ amount: errMsg(e, 'Không gửi được lệnh rút. Thử lại sau nhé.') });
    }
  };

  const toggle = (p: 'topup' | 'withdraw') => {
    setNotice(null);
    setPanel((cur) => (cur === p ? 'none' : p));
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Ví của tôi</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={KEYBOARD_GAP}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={balance.isRefetching || payments.isRefetching}
            onRefresh={refreshAll}
            colors={[Palette.brand]}
          />
        }>
        {/* Số dư */}
        <View style={styles.card}>
          <Text style={styles.kicker}>SỐ DƯ KHẢ DỤNG</Text>
          {balance.isPending ? (
            <ActivityIndicator color={Palette.brand} style={styles.balanceLoading} />
          ) : balance.isError ? (
            <View style={styles.balanceErr}>
              <Text variant="bodyMuted">Không tải được số dư.</Text>
              <Button title="Thử lại" variant="secondary" onPress={() => balance.refetch()} />
            </View>
          ) : (
            <Text style={styles.balance}>{formatVnd(available)}</Text>
          )}
          {held > 0 ? (
            <View style={styles.held}>
              <Ionicons name="lock-closed-outline" size={15} color={Palette.inkMuted} />
              <Text variant="bodyMuted" style={styles.heldText}>
                Đang giữ {formatVnd(held)} cho lệnh rút chờ duyệt.
              </Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title="Nạp tiền" onPress={() => toggle('topup')} />
            </View>
            <View style={styles.action}>
              <Button title="Rút tiền" variant="secondary" onPress={() => toggle('withdraw')} />
            </View>
          </View>
        </View>

        {notice ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={18} color={Palette.progressFg} />
            <Text variant="bodyMuted" style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {/* Nạp */}
        {panel === 'topup' ? (
          <View style={styles.card}>
            <Text variant="subheading">Nạp tiền vào ví</Text>
            <View style={styles.chips}>
              {QUICK_TOPUP.map((v) => {
                const on = Number(digits(topupAmount)) === v;
                return (
                  <Pressable
                    key={v}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setTopupAmount(String(v))}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{formatVnd(v)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextField
              label="Số tiền nạp"
              keyboardType="number-pad"
              value={topupAmount}
              onChangeText={(t) => setTopupAmount(digits(t))}
              placeholder={`Tối thiểu ${formatVnd(MIN_TOPUP)}`}
              error={topupErr ?? undefined}
            />
            <Text variant="caption" style={styles.via}>
              Thanh toán qua PayOS (chuyển khoản, quét mã QR ngân hàng).
            </Text>
            <Button title="Tiếp tục thanh toán" onPress={onTopup} loading={topup.isPending} />
          </View>
        ) : null}

        {/* Rút */}
        {panel === 'withdraw' ? (
          <View style={styles.card}>
            <Text variant="subheading">Rút tiền về ngân hàng</Text>
            {available < MIN_WITHDRAW ? (
              <Text style={styles.warn}>
                Cần tối thiểu {formatVnd(MIN_WITHDRAW)} để rút, ví đang có {formatVnd(available)}.
              </Text>
            ) : null}
            <TextField
              label="Số tiền rút"
              keyboardType="number-pad"
              value={form.amount}
              onChangeText={(t) => setForm((f) => ({ ...f, amount: digits(t) }))}
              placeholder={`Tối đa ${formatVnd(available)}`}
              error={errors.amount}
            />
            <TextField
              label="Ngân hàng"
              value={form.bank_name}
              onChangeText={(t) => setForm((f) => ({ ...f, bank_name: t }))}
              placeholder="VD: Vietcombank"
              error={errors.bank_name}
            />
            <TextField
              label="Số tài khoản"
              keyboardType="number-pad"
              value={form.bank_account}
              onChangeText={(t) => setForm((f) => ({ ...f, bank_account: t }))}
              error={errors.bank_account}
            />
            <TextField
              label="Chủ tài khoản"
              autoCapitalize="characters"
              value={form.bank_holder}
              onChangeText={(t) => setForm((f) => ({ ...f, bank_holder: t }))}
              placeholder="Viết hoa không dấu, như trên thẻ"
              error={errors.bank_holder}
            />
            <Button
              title="Gửi lệnh rút"
              onPress={onWithdraw}
              loading={withdraw.isPending}
              disabled={available < MIN_WITHDRAW}
            />
          </View>
        ) : null}

        {/* Lệnh rút */}
        {(withdrawals.data?.length ?? 0) > 0 ? (
          <View style={styles.card}>
            <Text variant="subheading">Lệnh rút tiền</Text>
            {withdrawals.data!.map((w) => {
              const meta = WITHDRAWAL_META[w.status] ?? { label: w.status, tone: 'pending' as const };
              const tone = TONE[meta.tone];
              return (
                <View key={w.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{formatVnd(Number(w.amount))}</Text>
                    <Text variant="caption" numberOfLines={1}>
                      {w.bank_name} · {w.bank_account} · {dateLabel(w.created_at)}
                    </Text>
                    {w.status === 'rejected' && w.note ? (
                      <Text variant="caption" style={styles.rejectNote}>Lý do: {w.note}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.status, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusText, { color: tone.fg }]}>{meta.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Lịch sử */}
        <View style={styles.card}>
          <Text variant="subheading">Lịch sử giao dịch</Text>
          {payments.isPending ? (
            <ActivityIndicator color={Palette.brand} style={styles.listLoading} />
          ) : payments.isError ? (
            <Text variant="bodyMuted" style={styles.empty}>Không tải được lịch sử. Kéo xuống để thử lại.</Text>
          ) : (payments.data?.length ?? 0) === 0 ? (
            <Text variant="bodyMuted" style={styles.empty}>Chưa có giao dịch nào.</Text>
          ) : (
            payments.data!.map((p) => {
              const flow = p.amount > 0 ? 'in' : 'out';
              const sign = flow === 'in' ? '+' : '−';
              return (
                <View key={p.id} style={styles.row}>
                  <View style={[styles.flowIcon, flow === 'in' ? styles.flowIn : styles.flowOut]}>
                    <Ionicons
                      name={flow === 'in' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={flow === 'in' ? Palette.successFg : Palette.inkMuted}
                    />
                  </View>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {LEDGER_LABEL[p.type] ?? p.note ?? p.type}
                    </Text>
                    <Text variant="caption">
                      {dateLabel(p.created_at)} · Số dư {formatVnd(Number(p.balance_after))}
                    </Text>
                  </View>
                  <Text style={[styles.amount, flow === 'in' && styles.amountIn]}>
                    {sign}
                    {formatVnd(Math.abs(p.amount))}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </KeyboardAwareScrollView>
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
  body: { padding: 12, gap: 12 },
  card: { backgroundColor: Palette.surfaceCard, borderRadius: Radius.card, padding: 16, gap: 12 },
  kicker: { fontFamily: Font.semibold, fontSize: 11.5, letterSpacing: 0.6, color: Palette.inkFaint },
  balance: {
    fontFamily: Font.bold,
    fontSize: 30,
    lineHeight: 38,
    color: Palette.ink,
    fontVariant: ['tabular-nums'],
  },
  balanceLoading: { alignSelf: 'flex-start', marginVertical: 8 },
  balanceErr: { gap: 8 },
  held: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heldText: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  action: { flex: 1 },
  notice: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: Palette.progressBg,
    borderRadius: Radius.card,
    padding: 12,
  },
  noticeText: { flex: 1, color: Palette.progressFg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  chipOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  chipText: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.ink },
  chipTextOn: { color: Palette.brand, fontFamily: Font.semibold },
  via: { color: Palette.inkMuted },
  warn: {
    fontFamily: Font.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: Palette.pendingFg,
    backgroundColor: Palette.pendingBg,
    borderRadius: Radius.control,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: Font.semibold, fontSize: 14, lineHeight: 20, color: Palette.ink },
  rejectNote: { color: Palette.dangerFg },
  status: { borderRadius: Radius.control, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: Font.semibold, fontSize: 11.5 },
  flowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flowIn: { backgroundColor: Palette.successBg },
  flowOut: { backgroundColor: Palette.neutralBg },
  amount: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, fontVariant: ['tabular-nums'] },
  amountIn: { color: Palette.successFg },
  listLoading: { marginVertical: 12 },
  empty: { paddingVertical: 8 },
});
