import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import {
  getFirebaseAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@/lib/firebase';
import { GOOGLE_CLIENT_IDS, googleConfigured } from '@/lib/firebase-config';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

/**
 * Đăng nhập bằng Google — luồng NATIVE (@react-native-google-signin).
 *
 * VÌ SAO KHÔNG DÙNG expo-auth-session (browser) NỮA: Google CHẶN luồng OAuth qua
 * trình duyệt/Custom Tab khi dùng client ID loại "Android" (trả 400
 * invalid_request). Custom-scheme chỉ được chấp nhận cho client iOS/Web. Trên
 * Android bắt buộc dùng Google Identity Services native — nó lấy idToken cho
 * `webClientId` (idToken này Firebase chấp nhận), rồi ta đổi sang Firebase
 * credential → getIdToken → backend /auth/firebase (tự tạo tài khoản nếu chưa có).
 *
 * `webClientId` là BẮT BUỘC để idToken phát hành cho đúng audience Firebase.
 * google-services.json (đã thêm) cấp cấu hình FCM/OAuth cho SDK native.
 */
// GSI là module native — chỉ cấu hình trên native (web không có).
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_IDS.web,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
  });
}

export function useGoogleAuth() {
  const signIn = useAuthStore((s) => s.signIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(googleIdToken: string) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('firebase-not-configured');
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const userCred = await signInWithCredential(auth, credential);
    const firebaseIdToken = await userCred.user.getIdToken();
    await authApi.firebaseLogin(firebaseIdToken);
    await signIn();
    router.replace('/');
  }

  return {
    // Native GSI luôn sẵn sàng khi đã cấu hình (không cần dựng request như trước).
    ready: googleConfigured,
    busy,
    error,
    signInWithGoogle: async () => {
      if (busy) return;
      setError(null);
      setBusy(true);
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const res = await GoogleSignin.signIn();
        if (isSuccessResponse(res)) {
          const idToken = res.data.idToken;
          if (idToken) {
            await finish(idToken);
          } else {
            setError('Đăng nhập Google chưa được, thử lại nhé.');
          }
        }
        // res.type === 'cancelled' → người dùng đóng, không báo lỗi.
      } catch (e) {
        // Người dùng huỷ giữa chừng thì im lặng; còn lại báo lỗi nhẹ.
        if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
          // bỏ qua
        } else {
          setError('Đăng nhập Google chưa được, thử lại nhé.');
        }
      } finally {
        setBusy(false);
      }
    },
  };
}
