import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Nơi cất token.
 *
 * Native: dùng expo-secure-store — đẩy xuống Keychain (iOS) / Keystore
 * (Android), mã hoá ở tầng hệ điều hành. AsyncStorage chỉ là file thường,
 * máy root/jailbreak là đọc được.
 *
 * Web: SecureStore không tồn tại, dùng localStorage (chỉ để chạy bản web
 * dev/preview — bản thật là app di động).
 */

const ACCESS_KEY = 'zoldify.access_token';
const REFRESH_KEY = 'zoldify.refresh_token';

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_KEY);
  },

  getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_KEY);
  },

  async save(accessToken: string, refreshToken?: string): Promise<void> {
    await setItem(ACCESS_KEY, accessToken);
    if (refreshToken) {
      await setItem(REFRESH_KEY, refreshToken);
    }
  },

  async clear(): Promise<void> {
    await removeItem(ACCESS_KEY);
    await removeItem(REFRESH_KEY);
  },
};
