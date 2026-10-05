import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuthStore } from '@/features/auth/store';
import { Palette } from '@/components/ui/theme';
import { removePushToken, savePushToken } from './api';
import { notificationRoute } from './route';

/**
 * Push notification (FCM) cho Zoldify.
 *
 * Luồng: đăng nhập → xin quyền → lấy FCM device token → POST lên BE. BE gửi push
 * qua firebase-admin mỗi khi tạo notification; bấm vào push thì điều hướng theo
 * `data` (type + id) — dùng chung notificationRoute (route.ts) với màn Thông báo. Đăng xuất thì gỡ token.
 *
 * KHÔNG dùng Expo push service / EAS projectId: BE đã có firebase-admin nên gửi
 * FCM thẳng, đơn giản hơn và không phụ thuộc hạ tầng Expo.
 */

// Foreground: vẫn hiện banner + kêu (mặc định expo nuốt khi app đang mở).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Token đang giữ, để gỡ đúng cái khi đăng xuất.
let currentToken: string | null = null;

/** Android bắt buộc có channel thì mới hiện notification. */
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Thông báo Zoldify',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: Palette.brand,
  });
}

/** Xin quyền, lấy FCM token, gửi lên BE. Trả token hoặc null (nuốt lỗi mềm). */
export async function registerForPush(): Promise<string | null> {
  try {
    await ensureAndroidChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let granted = existing === 'granted';
    if (!granted) {
      const { status } = await Notifications.requestPermissionsAsync();
      granted = status === 'granted';
    }
    if (!granted) return null;

    // Token FCM native (không cần projectId như Expo push token).
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token || typeof token !== 'string') return null;

    currentToken = token;
    // eslint-disable-next-line no-console
    console.log('[push] FCM token:', token);
    await savePushToken(token, Platform.OS);
    return token;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[push] register error:', (e as Error).message);
    return null;
  }
}

/** Điều hướng từ `data` của push (FCM đặt cả `type` vào trong data). */
function routeFromData(data: Record<string, unknown> | undefined) {
  return data ? notificationRoute(String(data.type ?? ''), data) : null;
}

/**
 * Gắn ở RootLayout: đăng ký token khi đã đăng nhập, gỡ khi đăng xuất, và lắng
 * nghe cú bấm vào push để điều hướng. Cũng xử lý trường hợp mở app TỪ push khi
 * app đang tắt (getLastNotificationResponseAsync).
 */
export function usePushNotifications() {
  const status = useAuthStore((s) => s.status);
  const prevStatus = useRef(status);

  // Bấm vào push -> điều hướng.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const to = routeFromData(resp.notification.request.content.data as Record<string, unknown>);
      if (to) router.push(to as never);
    });
    // App mở từ trạng thái tắt do bấm push.
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (!resp) return;
      const to = routeFromData(resp.notification.request.content.data as Record<string, unknown>);
      if (to) router.push(to as never);
    });
    return () => sub.remove();
  }, []);

  // Đăng ký/gỡ token theo phiên đăng nhập.
  useEffect(() => {
    if (status === 'signedIn') {
      registerForPush();
    } else if (prevStatus.current === 'signedIn' && currentToken) {
      // Vừa đăng xuất: gỡ token để thiết bị thôi nhận push của user cũ.
      const t = currentToken;
      currentToken = null;
      removePushToken(t).catch(() => {});
    }
    prevStatus.current = status;
  }, [status]);
}
