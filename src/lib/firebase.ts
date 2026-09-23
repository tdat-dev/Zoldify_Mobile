import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  inMemoryPersistence,
  initializeAuth,
  signInWithCredential,
  type Auth,
} from 'firebase/auth';

import { FIREBASE_CONFIG, googleConfigured } from './firebase-config';

/**
 * Firebase Auth chỉ dùng THOÁNG QUA để đổi Google credential lấy Firebase
 * idToken (rồi gửi backend /auth/firebase). Không cần Firebase giữ phiên —
 * phiên thật là JWT của mình — nên dùng inMemoryPersistence, khỏi kéo theo
 * AsyncStorage.
 */
let cached: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!googleConfigured) return null;
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  if (!cached) {
    try {
      cached = initializeAuth(app, { persistence: inMemoryPersistence });
    } catch {
      cached = getAuth(app);
    }
  }
  return cached;
}

export { GoogleAuthProvider, signInWithCredential };
