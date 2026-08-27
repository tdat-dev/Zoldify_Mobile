import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';

import {
  getFirebaseAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@/lib/firebase';
import { GOOGLE_CLIENT_IDS, googleConfigured } from '@/lib/firebase-config';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

// Cần cho luồng redirect OAuth (đóng popup/redirect đúng cách trên web + native).
WebBrowser.maybeCompleteAuthSession();

/**
 * Đăng nhập bằng Google: mở Google → lấy Google id_token → đổi sang Firebase
 * credential → getIdToken → gửi backend /auth/firebase (backend tự tạo tài
 * khoản nếu chưa có) → vào feed. Không cấu hình client ID thì trả ready=false
 * để nút Google hiện dạng mờ.
 */
export function useGoogleAuth() {
  const signIn = useAuthStore((s) => s.signIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios || undefined,
    androidClientId: GOOGLE_CLIENT_IDS.android || undefined,
    webClientId: GOOGLE_CLIENT_IDS.web || undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        void finish(idToken);
      } else {
        setError('Đăng nhập Google chưa được, thử lại nhé.');
        setBusy(false);
      }
    } else if (response.type === 'error') {
      setError('Đăng nhập Google chưa được, thử lại nhé.');
      setBusy(false);
    } else {
      // dismiss / cancel / locked
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function finish(googleIdToken: string) {
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('firebase-not-configured');
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCred = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCred.user.getIdToken();
      await authApi.firebaseLogin(firebaseIdToken);
      await signIn();
      router.replace('/');
    } catch {
      setError('Đăng nhập Google chưa được, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  }

  return {
    /** Đã sẵn sàng bấm (đã cấu hình + request dựng xong). */
    ready: googleConfigured && !!request,
    busy,
    error,
    signInWithGoogle: async () => {
      if (busy) return;
      setError(null);
      setBusy(true);
      const res = await promptAsync();
      // promptAsync trả về sớm nếu bị chặn/không mở được → thả cờ busy.
      if (res?.type !== 'success') setBusy(false);
    },
  };
}
