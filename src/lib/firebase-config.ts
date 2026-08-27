import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Cấu hình Firebase phía CLIENT cho project `zoldify` (backend verify idToken
 * của đúng project này). Lấy tự động bằng `firebase apps:sdkconfig`.
 *
 * LƯU Ý: apiKey + các OAuth client ID dưới đây là ĐỊNH DANH CÔNG KHAI phía
 * client, KHÔNG phải secret — an toàn để nằm trong mã nguồn app (bảo mật thật
 * do Firebase rules + authorized domains + backend JWT lo). Đây là lý do web
 * cũng phơi apiKey ra bundle.
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBOZelXZUA1DancRq3ZaOoU4B85GiOBn5E',
  authDomain: 'zoldify.firebaseapp.com',
  projectId: 'zoldify',
  appId: '1:1031347416096:web:13d6c48bf931dfec066045',
  messagingSenderId: '1031347416096',
  storageBucket: 'zoldify.firebasestorage.app',
} as const;

/**
 * OAuth client ID cho Google Sign-In (expo-auth-session).
 * - web: dùng cho web preview + đổi lấy Firebase credential.
 * - ios: client của app iOS `com.zoldify.app`.
 * - android: CHỜ SHA-1 (tạo Android OAuth client) — để trống thì nút Google
 *   vẫn chạy trên web/iOS, chỉ Android là chưa.
 */
export const GOOGLE_CLIENT_IDS = {
  web: '1031347416096-955r8fer0ea1jmtmc1ug61o6q2floqn0.apps.googleusercontent.com',
  ios: '1031347416096-fs98nutveg455ipeh44amtucuq6sl7g3.apps.googleusercontent.com',
  android: '1031347416096-8p8lbnipo926ehn43ht82cropg9eepbp.apps.googleusercontent.com',
} as const;

/** Google bật được khi có tối thiểu Firebase apiKey + web client ID. */
export const googleConfigured = Boolean(FIREBASE_CONFIG.apiKey && GOOGLE_CLIENT_IDS.web);

/**
 * Có nên HIỆN nút Google ở đây không.
 *
 * Trên WEB, expo-auth-session tạo PKCE bằng WebCrypto — thứ chỉ tồn tại ở
 * "secure origin" (localhost hoặc https). Khi mở app qua LAN `http://<IP>:8081`
 * (test trên điện thoại) thì origin KHÔNG secure → gọi sẽ ném lỗi
 * "Access to the WebCrypto API is restricted to secure origins" và làm hỏng
 * màn. Vậy chỉ hiện nút khi: native (không phải web), hoặc web ở secure origin.
 *
 * Trên NATIVE, còn loại trừ **Expo Go** (`storeClient`): app chạy dưới danh
 * tính Expo Go (bundle host.exp.Exponent), không phải `com.zoldify.app`, nên
 * redirect OAuth của Google không khớp client ID → không về được. Google gốc
 * chỉ chạy trên **dev build / standalone**.
 */
export function googleAvailable(): boolean {
  if (!googleConfigured) return false;
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.isSecureContext === true;
  }
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}
