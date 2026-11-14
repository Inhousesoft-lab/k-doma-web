/**
 * 로그인 상태와 화면 변경 알림 (서비스 공통)
 * - 로그인 상태: Firebase Auth 가 관리한다. 세션 유지(browserSessionPersistence)라 새로고침해도 유지되고 탭을 닫으면 풀린다.
 * - 아이디 = 이메일. Firebase 에 등록된 계정이면 누구나 로그인하고, 로그인하면 내 1인 가구가 생긴다 (KD-58).
 * - 회원가입·가구 합류는 MVP 2.
 */
import { CartItem, Ingredient, MealPlan, UserProfile } from '../types';
import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../lib/firebase';
import { loadCart, loadFridge, loadPlans, startHouseholdSync, stopHouseholdSync } from './householdStore';
import { cachedFavoriteSet, favoritesReady, startFavoritesSync, stopFavoritesSync } from './favoritesStore';

/** 로그인한 계정의 Firebase uid. 비로그인이면 null */
let currentUserId: string | null = null;

/** 로그인한 계정의 uid (비로그인 null) */
export const currentUid = (): string | null => currentUserId;


/** 처음 로그인 상태를 확인할 때까지 기다린다. main.tsx 가 첫 화면을 그리기 전에 기다린다 */
export const authReady: Promise<void> = setPersistence(auth, browserSessionPersistence)
  .catch(() => undefined) // 저장소를 못 쓰는 환경이면 기본 유지 방식 그대로
  .then(
    () =>
      new Promise<void>((resolve) => {
        onAuthStateChanged(auth, (user) => {
          const nextId = user?.uid ?? null;
          const changed = nextId !== currentUserId;
          currentUserId = nextId;
          syncHousehold(user);
          resolve();
          if (changed) notifyListeners();
        });
      })
  );

/** 데이터를 바꾸는 동작은 로그인한 계정만 할 수 있다. 화면에서 먼저 막고, 여기서 한 번 더 막는다 */
export class LoginRequiredError extends Error {
  constructor() {
    super('로그인이 필요해요');
    this.name = 'LoginRequiredError';
  }
}
export const requireUser = (): string => {
  if (!currentUserId) throw new LoginRequiredError();
  return currentUserId;
};

/** 로그인하면 가구 냉장고·장바구니·기록과 내 찜(Firestore) 구독을 시작하고, 로그아웃하면 멈춘다 */
function syncHousehold(user: User | null) {
  if (user) {
    startHouseholdSync(user.uid, notifyListeners);
    startFavoritesSync(user.uid, notifyListeners);
  } else {
    stopHouseholdSync();
    stopFavoritesSync();
  }
}

/** 내 찜 (비로그인은 빈 찜). 하트를 그릴 때 바로 쓴다 */
export const favoriteSet = (): ReadonlySet<string> => (currentUserId ? cachedFavoriteSet() : new Set<string>());

/** 로그인 상태면 찜 첫 목록을 받을 때까지 기다린다 (첫 화면에서 하트가 깜빡이지 않게) */
export const waitFavorites = async (): Promise<void> => {
  if (currentUserId) await favoritesReady();
};

/**
 * 지금 계정 가구의 냉장고 목록
 * 비로그인: 빈 냉장고 (KD-47). Today 추천·요리 목록 부족 계산도 빈 냉장고 기준. 바꾸기는 로그인 필요
 */
export const fridge = async (): Promise<Ingredient[]> => (currentUserId ? loadFridge() : []);

/** 지금 계정 가구의 장바구니 (가구 공유). 비로그인은 빈 장바구니 (KD-49) */
export const cart = async (): Promise<CartItem[]> => (currentUserId ? loadCart() : []);

/** 지금 계정 가구의 요리 기록 (가구 공유, KD-57). 비로그인은 빈 기록 (KD-48) */
export const plans = async (): Promise<MealPlan[]> => (currentUserId ? loadPlans() : []);

// 리스너 패턴 (냉장고/계획/장바구니 변경 시 자동 갱신)
type ChangeListener = () => void;
const changeListeners: Set<ChangeListener> = new Set();

const notifyListeners = () => {
  changeListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
};

export const subscribeToDataChanges = (listener: ChangeListener) => {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
};

const GUEST_PROFILE: UserProfile = { id: '', name: '', role: 'MEMBER', householdName: '' };

/** 로그인한 계정 프로필. 이름은 Auth 표시 이름, 없으면 이메일 @ 앞부분. 1인 가구의 관리자 (KD-58) */
const toProfile = (user: User): UserProfile => ({
  id: user.uid,
  name: user.displayName?.trim() || user.email?.split('@')[0] || '나',
  role: 'ADMIN',
  householdName: '우리 집',
  email: user.email ?? undefined,
});

export const authService = {
  isLoggedIn(): boolean {
    return currentUserId !== null;
  },

  /** 로그인한 계정 프로필. 비로그인이면 빈 프로필 */
  getCurrentUser(): UserProfile {
    const user = auth.currentUser;
    return currentUserId && user?.uid === currentUserId ? toProfile(user) : { ...GUEST_PROFILE };
  },

  /** 이메일 아이디 로그인: Firebase Auth 이메일/비밀번호 계정으로 확인한다 */
  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    const failed = { success: false, message: '아이디 또는 비밀번호가 맞지 않아요' };
    if (!email || !password) return failed;
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      currentUserId = user.uid; // onAuthStateChanged 보다 먼저 화면이 바뀌어도 맞게
      syncHousehold(user); // 화면이 바로 냉장고·장바구니·기록을 읽어도 되도록 구독을 먼저 시작한다
      notifyListeners();
      return { success: true };
    } catch (e) {
      if (e instanceof FirebaseError && e.code === 'auth/network-request-failed') {
        return { success: false, message: '네트워크 연결을 확인해 주세요' };
      }
      if (e instanceof FirebaseError && e.code === 'auth/too-many-requests') {
        return { success: false, message: '잠시 후 다시 시도해 주세요' };
      }
      return failed;
    }
  },

  /** 같은 가구 구성원. MVP 2 전까지는 1인 가구라 나 혼자 (KD-58) */
  getHouseholdMembers(): UserProfile[] {
    return currentUserId ? [authService.getCurrentUser()] : [];
  },

  logout(): void {
    currentUserId = null;
    notifyListeners();
    signOut(auth).catch((e) => console.error(e));
  },
};
