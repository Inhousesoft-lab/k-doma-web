import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Firebase 웹 설정값은 .env.local 의 VITE_FIREBASE_* 에서 읽는다 (.env 참고)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Firebase 설정이 없습니다. .env.local 에 VITE_FIREBASE_* 값을 넣어 주세요.');
}

/** true 면 실제 프로젝트 대신 로컬 에뮬레이터(npm run emulators)에 붙는다 */
export const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

export const db = getFirestore(app);
if (useEmulator) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

// Analytics 는 실제 프로젝트에서, 브라우저가 지원할 때만 켠다 (일부 환경·쿠키 차단 시 에러 방지)
export const analytics: Promise<Analytics | null> = useEmulator
  ? Promise.resolve(null)
  : isSupported()
      .then((ok) => (ok ? getAnalytics(app) : null))
      .catch(() => null);
