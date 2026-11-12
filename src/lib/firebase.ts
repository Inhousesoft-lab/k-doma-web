import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Firebase 웹 설정값은 .env.local 의 VITE_FIREBASE_* 에서 읽는다 (.env.example 참고)
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

export const app = initializeApp(firebaseConfig);

// Analytics 는 브라우저가 지원할 때만 켠다 (일부 환경·쿠키 차단 시 에러 방지)
export const analytics: Promise<Analytics | null> = isSupported()
  .then((ok) => (ok ? getAnalytics(app) : null))
  .catch(() => null);
