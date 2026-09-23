import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Lưu trữ khoá–giá trị nhẹ, KHÔNG nhạy cảm (vd danh sách đã lưu). Dùng lại đúng
 * cách chọn backend như token-store: web -> localStorage, native -> SecureStore
 * (đã có sẵn, không phải thêm native dep/rebuild). Không dùng cho dữ liệu lớn:
 * SecureStore cảnh báo khi value vượt ~2KB — với danh sách id là thoải mái.
 */
const isWeb = Platform.OS === 'web';

export const kvStore = {
  async get(key: string): Promise<string | null> {
    if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (isWeb) {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
