import * as SecureStore from 'expo-secure-store';

/**
 * Nơi cất token.
 *
 * Dùng expo-secure-store chứ không phải AsyncStorage: SecureStore đẩy
 * xuống Keychain của iOS và Keystore của Android, tức được mã hoá ở tầng
 * hệ điều hành. AsyncStorage chỉ là file thường, máy đã root/jailbreak là
 * đọc được.
 *
 * Web không có SecureStore — nếu sau này chạy app trên web thì phải cắm
 * thêm một bản localStorage ở đây.
 */

const ACCESS_KEY = 'zoldify.access_token';
const REFRESH_KEY = 'zoldify.refresh_token';

export const tokenStore = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async save(accessToken: string, refreshToken?: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
