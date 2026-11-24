import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette, Radius } from '@/components/ui/theme';
import { fetchPayosOrderStatus, orderKeys, useSyncPayosOrder, walletKeys } from '@/features/orders/api';
import { walletListKeys } from '@/features/wallet/api';
import { APP_SCHEME } from '@/lib/config';

/** Hỏi lại trạng thái đơn khi đang đứng ở trang thanh toán (ms). */
const STATUS_POLL_MS = 5000;

/**
 * Trang thanh toán PayOS hiển thị TRONG app.
 *
 * Nội dung là đúng trang `pay.payos.vn` như web (mã VietQR, số tài khoản, nút
 * sao chép, nút mở app ngân hàng) — chỉ khác là nằm trong WebView thay vì
 * Custom Tab của trình duyệt, nên người dùng không bị đẩy ra ngoài app.
 *
 * Ba việc màn này phải tự lo:
 *  1. Link lạ không phải http(s) (app ngân hàng, `intent://`) → đẩy ra app ngoài
 *     bằng `Linking`, WebView không mở được những scheme đó.
 *  2. PayOS trả về `zoldify://payment/return` sau khi trả xong → đóng màn, không
 *     để WebView báo lỗi trang.
 *  3. Đơn hàng: poll `GET /payos/order/:id` để tự đóng khi PayOS báo đã trả
 *     (webhook có thể tới chậm) và hỏi thẳng PayOS một lần lúc đóng.
 */
export default function PayosWebScreen() {
  const params = useLocalSearchParams<{ url?: string; kind?: string; orderId?: string; from?: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const sync = useSyncPayosOrder();

  const url = params.url ?? '';
  const isOrder = params.kind === 'order';
  const orderId = Number(params.orderId) || 0;
  /** Mở bằng `replace` từ checkout: đóng thì về chi tiết đơn, không quay lại checkout. */
  const fromCheckout = params.from === 'checkout';

  const webRef = useRef<ComponentRef<typeof WebView>>(null);
  const canGoBackRef = useRef(false);
  const closedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  /** Đổi key để WebView tải lại từ đầu khi bấm "Thử lại". */
  const [reloadKey, setReloadKey] = useState(0);

  // `mutate` của useMutation đổi danh tính mỗi lần render; đi qua ref để các
  // callback bên dưới không bị tạo lại (effect poll sẽ bị reset liên tục).
  const syncOrderRef = useRef(sync.mutate);
  useEffect(() => {
    syncOrderRef.current = sync.mutate;
  }, [sync.mutate]);

  const refreshData = useCallback(() => {
    qc.invalidateQueries({ queryKey: orderKeys.all });
    qc.invalidateQueries({ queryKey: walletKeys.balance });
    qc.invalidateQueries({ queryKey: walletListKeys.transactions });
    // Hỏi thẳng PayOS: webhook có thể chưa tới, người dùng đóng màn ngay sau khi
    // chuyển khoản mà không thấy đơn đổi trạng thái thì tưởng mất tiền.
    if (isOrder && orderId) syncOrderRef.current(orderId);
  }, [qc, isOrder, orderId]);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    refreshData();
    if (fromCheckout && orderId) {
      router.replace({ pathname: '/orders/[id]', params: { id: String(orderId) } });
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace(isOrder ? '/orders' : '/wallet');
  }, [fromCheckout, orderId, isOrder, refreshData]);

  // Tự đóng khi đơn đã trả (người dùng quét QR bằng app ngân hàng rồi quay lại).
  useEffect(() => {
    if (!isOrder || !orderId) return;
    let stopped = false;
    const tick = async () => {
      try {
        const order = await fetchPayosOrderStatus(orderId);
        if (!stopped && order?.is_paid) close();
      } catch {
        // Mạng chập chờn: lần sau hỏi lại, không làm phiền người dùng.
      }
    };
    const timer = setInterval(tick, STATUS_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isOrder, orderId, close]);

  // Nút back cứng của Android: lùi trong trang trước, hết trang thì đóng màn.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) {
        webRef.current?.goBack();
        return true;
      }
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  /**
   * Quyết định cho WebView tự tải hay không. Trả `false` là chặn.
   */
  const onShouldStartLoadWithRequest = (req: WebViewNavigation): boolean => {
    const next = req.url;
    if (!next) return true;
    // PayOS trả về app sau khi thanh toán xong (returnUrl = zoldify://payment/return).
    if (next.startsWith(`${APP_SCHEME}://`)) {
      close();
      return false;
    }
    if (/^(https?:|about:|data:|blob:)/i.test(next)) return true;
    // `intent://...`, `vnpay://...`, link App Store/CH Play của app ngân hàng:
    // WebView không xử lý được, đưa cho hệ điều hành.
    Linking.openURL(next).catch(() => {
      setFailed(false);
    });
    return false;
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng trang thanh toán"
        hitSlop={10}
        onPress={close}
        style={styles.iconHit}>
        <Ionicons name="close" size={24} color={Palette.ink} />
      </Pressable>
      <Text variant="subheading" numberOfLines={1} style={styles.headerTitle}>
        {isOrder ? 'Thanh toán đơn hàng' : 'Nạp tiền vào ví'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tải lại trang"
        hitSlop={10}
        onPress={() => {
          setFailed(false);
          setLoading(true);
          setReloadKey((k) => k + 1);
        }}
        style={styles.iconHit}>
        <Ionicons name="refresh" size={20} color={Palette.inkMuted} />
      </Pressable>
    </View>
  );

  if (!url) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text variant="heading">Thiếu link thanh toán</Text>
          <Text variant="bodyMuted" style={styles.centerText}>
            Đóng màn này rồi bấm thanh toán lại nhé.
          </Text>
          <Button title="Đóng" style={styles.retry} onPress={close} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <View style={styles.webWrap}>
        {failed ? (
          <View style={styles.center}>
            <Text variant="heading">Không tải được trang thanh toán</Text>
            <Text variant="bodyMuted" style={styles.centerText}>
              Kiểm tra kết nối mạng rồi thử lại. Đơn hàng của bạn vẫn được giữ.
            </Text>
            <Button
              title="Thử lại"
              style={styles.retry}
              onPress={() => {
                setFailed(false);
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
            />
          </View>
        ) : (
          <WebView
            key={reloadKey}
            ref={webRef}
            source={{ uri: url }}
            // Mở cửa sổ mới (window.open) trong cùng WebView thay vì bật trình duyệt.
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={(nav) => {
              canGoBackRef.current = nav.canGoBack;
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            style={styles.web}
            renderLoading={() => (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={Palette.brand} />
              </View>
            )}
            startInLoadingState
          />
        )}
        {loading && !failed ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Palette.brand} />
            <Text variant="bodyMuted" style={styles.loadingText}>
              Đang mở trang thanh toán…
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfaceCard },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.lineStrong,
    backgroundColor: Palette.surfaceCard,
  },
  iconHit: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  webWrap: { flex: 1 },
  web: { flex: 1, backgroundColor: Palette.surfaceCard },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Palette.surfaceCard,
  },
  loadingText: { textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  centerText: { textAlign: 'center' },
  retry: { marginTop: 12, borderRadius: Radius.control },
});
