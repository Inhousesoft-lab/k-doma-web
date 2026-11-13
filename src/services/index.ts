import {
  Ingredient,
  IngredientStatus,
  Recipe,
  CartItem,
  MealPlan,
  MasterIngredient,
  UserProfile,
  StorageZone,
} from '../types';
import {
  buildPlans,
  clone,
  ingredientsData,
  recipesData,
  toProfile,
  usersData,
} from '../data';
import {
  canonicalName,
  findByIngredientName,
  findMasterIngredient,
  getMissingIngredientNames,
  isSameIngredient,
} from '../utils/ingredient';
import { todayStr } from '../utils/date';
import { pickThemes, recommend, type RecommendedItem } from '../recommendation';
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
import {
  addCartItems,
  cachedCart,
  cachedFridge,
  deleteCartItem,
  deleteIngredient,
  loadCart,
  loadFridge,
  moveCartItemToFridge,
  setIngredientStatus,
  setStatusesBatch,
  startHouseholdSync,
  stopHouseholdSync,
  updateCartItem,
  upsertIngredient,
} from './householdStore';
import {
  addFavorite as saveFavorite,
  cachedFavoriteSet,
  favoritesReady,
  loadFavoriteIds,
  removeFavorite,
  startFavoritesSync,
  stopFavoritesSync,
} from './favoritesStore';

// 메모리 저장소: 앱을 열 때 JSON(src/data)으로 채우고, 바뀐 값은 메모리에만 둔다 (새로고침하면 초기화)
// 냉장고·장바구니는 가구 공유로 Firestore(householdStore.ts)에 저장한다
// 찜은 계정별로 Firestore(favoritesStore.ts)에 저장한다 (KD-27)
const inMemoryRecipes: Recipe[] = clone(recipesData);
const inMemoryPlans: MealPlan[] = buildPlans(); // 계정별 요리 기록

// 로그인 상태: Firebase Auth 가 관리한다. 세션 유지(browserSessionPersistence)라 새로고침해도 유지되고 탭을 닫으면 풀린다.
// 아이디 = 이메일. 지금은 계정 1개만 쓴다: VITE_OWNER_EMAIL 로 로그인하면 users.json 의 첫 프로필(태링)이 된다.
// (이메일은 저장소에 올리지 않으려고 .env.local 에 둔다. 가입·가구 합류 기능은 아직 없음)
const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL ?? '').trim().toLowerCase();
const OWNER_PROFILE_ID = usersData[0]?.id ?? null;

/** Firebase 계정을 앱 계정 id 로. 지정한 이메일이 아니면 로그인 안 된 것으로 본다 */
const toAppUserId = (user: User | null): string | null =>
  OWNER_EMAIL && user?.email?.toLowerCase() === OWNER_EMAIL ? OWNER_PROFILE_ID : null;

let currentUserId: string | null = null;

/** 처음 로그인 상태를 확인할 때까지 기다린다. main.tsx 가 첫 화면을 그리기 전에 기다린다 */
export const authReady: Promise<void> = setPersistence(auth, browserSessionPersistence)
  .catch(() => undefined) // 저장소를 못 쓰는 환경이면 기본 유지 방식 그대로
  .then(
    () =>
      new Promise<void>((resolve) => {
        onAuthStateChanged(auth, (user) => {
          const nextId = toAppUserId(user);
          const changed = nextId !== currentUserId;
          currentUserId = nextId;
          syncHousehold(user, nextId);
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
const requireUser = (): string => {
  if (!currentUserId) throw new LoginRequiredError();
  return currentUserId;
};

/** 지금 로그인한 계정 id (비로그인이면 빈 문자열 → 계정별 데이터는 비어 있음) */
const uid = (): string => currentUserId ?? '';

/** 로그인하면 가구 냉장고·장바구니와 내 찜(Firestore) 구독을 시작하고, 로그아웃하면 멈춘다 */
function syncHousehold(user: User | null, appUserId: string | null) {
  if (user && appUserId) {
    const householdName = usersData.find((u) => u.id === appUserId)?.householdName ?? '우리 집';
    startHouseholdSync(user.uid, householdName, notifyListeners);
    startFavoritesSync(user.uid, notifyListeners);
  } else {
    stopHouseholdSync();
    stopFavoritesSync();
  }
}

/** 내 찜 (비로그인은 빈 찜). 하트를 그릴 때 바로 쓴다 */
const favoriteSet = (): ReadonlySet<string> => (currentUserId ? cachedFavoriteSet() : new Set<string>());

/** 로그인 상태면 찜 첫 목록을 받을 때까지 기다린다 (첫 화면에서 하트가 깜빡이지 않게) */
const waitFavorites = async (): Promise<void> => {
  if (currentUserId) await favoritesReady();
};

/**
 * 지금 계정 가구의 냉장고 목록
 * 비로그인: 빈 냉장고 (KD-47). Today 추천·요리 목록 부족 계산도 빈 냉장고 기준. 바꾸기는 로그인 필요
 */
const fridge = async (): Promise<Ingredient[]> => (currentUserId ? loadFridge() : []);

/** 지금 계정 가구의 장바구니 (가구 공유). 비로그인은 빈 장바구니 (KD-49) */
const cart = async (): Promise<CartItem[]> => (currentUserId ? loadCart() : []);

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

/** 재료 사전 기준 구역. 사전에 없으면 냉장고 */
const zoneOf = (name: string): StorageZone => findMasterIngredient(name)?.zone ?? 'FRIDGE';

/** 장바구니 문서 값. 표준 이름·재료 사전 구역으로 맞춘다 */
const toCartUpsert = (name: string, isUrgent: boolean) => ({
  name: canonicalName(name),
  zone: zoneOf(name),
  isUrgent,
});

/** 장바구니 재료를 냉장고 '있음'으로 옮긴다. 이미 냉장고에 있으면(있음·적음·없음) 있음으로 바꾼다 (KD-28) */
const moveToFridge = async (name: string, cartItemId: string): Promise<void> => {
  const match = findByIngredientName(name, await fridge());
  const master = findMasterIngredient(name);
  await moveCartItemToFridge(cartItemId, {
    existingFridgeId: match?.id,
    upsert: {
      name: master?.name ?? canonicalName(name),
      zone: master?.zone ?? 'FRIDGE',
      status: 'HAVE',
      imageKey: master?.imageKey ?? null,
    },
  });
};

export const recipeService = {
  async getRecipes(): Promise<Recipe[]> {
    await waitFavorites();
    const favs = favoriteSet();
    return inMemoryRecipes.map((r) => ({ ...r, isFavorite: favs.has(r.id) }));
  },

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const r = inMemoryRecipes.find((recipe) => recipe.id === id);
    if (!r) return undefined;
    await waitFavorites();
    return { ...r, isFavorite: favoriteSet().has(r.id) };
  },

  /** 내 찜 목록 (최근 찜한 순). 비로그인은 빈 목록. 불러오기에 실패하면 오류를 던진다 */
  async getFavoriteRecipes(): Promise<Recipe[]> {
    if (!currentUserId) return [];
    const ids = await loadFavoriteIds();
    const byId = new Map(inMemoryRecipes.map((r) => [r.id, r]));
    return ids.flatMap((id) => {
      const r = byId.get(id);
      return r ? [{ ...r, isFavorite: true }] : []; // 없어진 요리는 건너뛴다
    });
  },

  /** 찜 켜기/끄기. 바뀐 뒤 상태를 돌려준다 */
  async toggleFavorite(id: string): Promise<boolean> {
    requireUser();
    await favoritesReady(); // 찜 목록을 받기 전이면 지금 상태를 잘못 보고 반대로 바꿀 수 있다
    if (favoriteSet().has(id)) {
      await removeFavorite(id);
      return false;
    }
    await saveFavorite(id);
    return true;
  },

  /**
   * 찜 켜기 (이미 찜했어도 그대로). 로그인 직후 찜할 때 쓴다:
   * 아직 찜 목록을 못 받았어도 토글처럼 꺼 버리지 않는다
   */
  async addFavorite(id: string): Promise<void> {
    requireUser();
    await saveFavorite(id);
  },

  isFavorite(id: string): boolean {
    return favoriteSet().has(id);
  },

  /**
   * 재료 보유 상태 및 부족 개수 계산
   */
  calculateMissing(recipe: Recipe, ingredients: Ingredient[]) {
    const missingNames = getMissingIngredientNames(recipe, ingredients);
    const missingCount = missingNames.length;
    return {
      missingCount,
      missingNames,
      statusLabel: missingCount === 0 ? '바로 가능' : `부족 ${missingCount}개`,
      feedStatusLabel: missingCount === 0 ? '바로 가능' : `부족 재료 ${missingCount}개`,
      isReady: missingCount === 0,
    };
  },
};

export const ingredientService = {
  async getIngredients(): Promise<Ingredient[]> {
    return [...(await fridge())];
  },

  async updateIngredientStatus(id: string, status: IngredientStatus): Promise<Ingredient | undefined> {
    requireUser();
    const item = (await fridge()).find((i) => i.id === id);
    if (!item) return undefined;
    await setIngredientStatus(id, status);
    return { ...item, status };
  },

  /**
   * 아이콘형 탭 시 상태 순환 (있음 -> 적음 -> 없음 -> 있음)
   */
  async cycleIngredientStatus(id: string): Promise<Ingredient | undefined> {
    requireUser();
    const item = (await fridge()).find((i) => i.id === id);
    if (!item) return undefined;
    const nextMap: Record<IngredientStatus, IngredientStatus> = {
      HAVE: 'LOW',
      LOW: 'NONE',
      NONE: 'HAVE',
    };
    const status = nextMap[item.status];
    await setIngredientStatus(id, status);
    return { ...item, status };
  },

  /**
   * 목록형 [빼기] 처리: 냉장고에서 완전히 제거
   */
  async removeIngredient(id: string): Promise<boolean> {
    requireUser();
    if (!(await fridge()).some((i) => i.id === id)) return false;
    await deleteIngredient(id);
    return true;
  },

  /**
   * 재료 추가 시트에서 선택한 재료들 일괄 등록 (기본 상태: 있음 HAVE). 이미 있는 재료는 건너뛴다
   */
  async addIngredients(
    newItems: Array<{ name: string; zone: StorageZone; imageKey?: string | null }>
  ): Promise<Ingredient[]> {
    requireUser();
    const current = await fridge();
    const toAdd = newItems.filter(
      (item, index) =>
        !findByIngredientName(item.name, current) &&
        newItems.findIndex((other) => isSameIngredient(other.name, item.name)) === index
    );
    await Promise.all(
      toAdd.map((item) =>
        upsertIngredient({ name: item.name, zone: item.zone, status: 'HAVE', imageKey: item.imageKey ?? null })
      )
    );
    return toAdd.map((item) => findByIngredientName(item.name, cachedFridge())).filter((i): i is Ingredient => !!i);
  },

  /**
   * 마스터 재료 목록 반환 (검색/추가 시트용)
   */
  async getMasterIngredients(zone?: StorageZone): Promise<MasterIngredient[]> {
    return zone ? ingredientsData.filter((m) => m.zone === zone) : ingredientsData;
  },

  /**
   * 요리 완료 후 재료 상태 일괄 반영 (공유 냉장고 저장)
   * 사용자가 고른 값을 그대로 저장한다. 냉장고에 없는(미등록) 재료는 건너뛴다.
   */
  async batchUpdateStatuses(updates: Array<{ name: string; status: IngredientStatus }>): Promise<void> {
    requireUser();
    const current = await fridge();
    const matched = updates.flatMap((update) => {
      const match = findByIngredientName(update.name, current);
      return match ? [{ id: match.id, status: update.status }] : [];
    });
    await setStatusesBatch(matched);
  },
};

export const cartService = {
  async getCartItems(): Promise<CartItem[]> {
    return [...(await cart())];
  },

  async getCartCount(): Promise<number> {
    return (await cart()).length;
  },

  isItemInCart(name: string): boolean {
    return Boolean(currentUserId && findByIngredientName(name, cachedCart()));
  },

  async toggleItemCheck(id: string): Promise<void> {
    requireUser();
    const item = (await cart()).find((i) => i.id === id);
    if (item) await updateCartItem(id, { checked: !item.checked });
  },

  /**
   * 재료를 장바구니에 담거나 빼기 ('꼭 사야 해요')
   * 같은 재료는 표준 이름 한 줄로 합친다 (KD-R05)
   */
  async toggleItem(name: string, isUrgent: boolean = true): Promise<boolean> {
    requireUser();
    const existing = findByIngredientName(name, await cart());
    if (existing) {
      await deleteCartItem(existing.id);
      return false;
    }
    await addCartItems([toCartUpsert(name, isUrgent)]);
    return true;
  },

  /**
   * 여러 재료 한 번에 장바구니에 담기 (이미 담긴 재료는 건너뛴다)
   */
  async addItems(names: string[], isUrgent: boolean = true): Promise<number> {
    requireUser();
    const current = await cart();
    const toAdd = names.filter(
      (name, index) =>
        !findByIngredientName(name, current) &&
        names.findIndex((other) => isSameIngredient(other, name)) === index
    );
    await addCartItems(toAdd.map((name) => toCartUpsert(name, isUrgent)));
    return toAdd.length;
  },

  /**
   * [집에 있어요]: 냉장고에 '있음(HAVE)'으로 저장하고 장바구니에서 지운다 (한 번에 저장)
   */
  async markAsInFridge(itemName: string, cartItemId: string): Promise<void> {
    requireUser();
    await moveToFridge(itemName, cartItemId);
  },

  /**
   * [+ 살 목록에]: 더 사두면 좋아요에서 꼭 사야 해요로 옮긴다.
   */
  async moveToUrgentCart(itemName: string): Promise<void> {
    requireUser();
    const existing = findByIngredientName(itemName, await cart());
    if (existing) {
      await updateCartItem(existing.id, { isUrgent: true });
    } else {
      await addCartItems([toCartUpsert(itemName, true)]);
    }
  },

  /**
   * [체크한 n개 냉장고에 등록]:
   * 체크한 재료를 냉장고에 '있음(HAVE)'으로 저장하고, 저장된 항목만 목록에서 지운다.
   * 항목마다 따로 저장해서, 실패한 항목만 체크된 채로 남긴다 (KD-36).
   */
  async registerCheckedToFridge(itemIds: string[]): Promise<{ successIds: string[]; failedIds: string[] }> {
    requireUser();
    const successIds: string[] = [];
    const failedIds: string[] = [];
    for (const item of (await cart()).filter((i) => itemIds.includes(i.id))) {
      try {
        await moveToFridge(item.name, item.id);
        successIds.push(item.id);
      } catch (e) {
        console.error(e);
        failedIds.push(item.id);
      }
    }
    return { successIds, failedIds };
  },

  /**
   * 냉장고에 등록된 재료 중 적음·없음 (더 사두면 좋아요, KD-35)
   * 이미 꼭 사야 해요에 있는 재료는 제외
   */
  async getNeedBuyFromFridge(): Promise<Array<{ id: string; name: string; status: IngredientStatus; zone: StorageZone }>> {
    const cartList = await cart();
    return (await fridge())
      .filter(
        (ing) =>
          (ing.status === 'LOW' || ing.status === 'NONE') && !findByIngredientName(ing.name, cartList)
      )
      .map((i) => ({ id: i.id, name: i.name, status: i.status, zone: i.zone }));
  },
};

export const mealPlanService = {
  /**
   * 특정 사용자의 계획 전체 (취소된 것 제외, 내 기록만 KD-27)
   */
  async getUserPlans(userId: string = uid()): Promise<MealPlan[]> {
    return inMemoryPlans.filter((p) => p.userId === userId && p.status !== 'CANCELED');
  },

  /**
   * 특정 날짜의 요리 계획 (취소된 것 제외)
   */
  async getPlanByDate(date: string, userId: string = uid()): Promise<MealPlan | undefined> {
    const found = inMemoryPlans.find(
      (p) => p.userId === userId && p.date === date && p.status !== 'CANCELED'
    );
    return found ? { ...found } : undefined;
  },

  /**
   * [요리 완료] -> COOKED 확정
   */
  async markPlanCooked(planId: string): Promise<MealPlan | undefined> {
    requireUser();
    const plan = inMemoryPlans.find((p) => p.id === planId);
    if (!plan) return undefined;
    plan.status = 'COOKED';
    notifyListeners();
    return { ...plan };
  },

  /**
   * [취소] -> CANCELED
   */
  async cancelPlan(planId: string): Promise<boolean> {
    requireUser();
    const plan = inMemoryPlans.find((p) => p.id === planId);
    if (!plan) return false;
    plan.status = 'CANCELED';
    notifyListeners();
    return true;
  },

  /**
   * 재고 반영 여부 표시 ('재고 반영됨 · 다시 수정')
   */
  async markInventoryUpdated(planId: string, updated: boolean = true): Promise<MealPlan | undefined> {
    requireUser();
    const plan = inMemoryPlans.find((p) => p.id === planId);
    if (!plan) return undefined;
    plan.inventoryUpdated = updated;
    notifyListeners();
    return { ...plan };
  },

  /**
   * 요리 상세 [오늘 기록에 추가]: 하루 1개, 이미 있으면 확인 없이 덮어쓰기 (KD-18, KD-38)
   */
  async setPlanForDate(date: string, recipeId: string, userId: string = uid()): Promise<MealPlan> {
    requireUser();
    const recipe = inMemoryRecipes.find((r) => r.id === recipeId);

    const existingIndex = inMemoryPlans.findIndex(
      (p) => p.userId === userId && p.date === date && p.status !== 'CANCELED'
    );

    const newPlan: MealPlan = {
      id: existingIndex >= 0 ? inMemoryPlans[existingIndex].id : `plan_${Date.now()}`,
      userId,
      date,
      recipeId,
      recipeName: recipe?.name || '추천 요리',
      photoUrl: recipe?.photoUrl,
      status: 'PLANNED',
      inventoryUpdated: false,
      caloriesKcal: recipe?.caloriesKcal,
    };

    if (existingIndex >= 0) {
      inMemoryPlans[existingIndex] = newPlan;
    } else {
      inMemoryPlans.push(newPlan);
    }

    notifyListeners();
    return { ...newPlan };
  },
};

/** Today 카드 하나: 요리와 재료 정보 줄용 부족 수 */
export interface TodayRecipeItem {
  recipe: Recipe;
  missingCount: number;
}

export interface TodayThemeSection {
  theme: string;
  items: TodayRecipeItem[];
}

export const recommendationService = {
  /**
   * 추천 요리 (03-2 3장, KD-50). 계산은 src/recommendation/engine.ts 가 한다.
   * 여기서는 레시피·냉장고(비로그인은 빈 냉장고)·내 기록만 모아 넘긴다.
   */
  async getRecommendations(userId: string = uid()): Promise<RecommendedItem[]> {
    const [recipes, ingredients, userPlans] = await Promise.all([
      recipeService.getRecipes(),
      ingredientService.getIngredients(),
      mealPlanService.getUserPlans(userId),
    ]);
    return recommend({ recipes, fridge: ingredients, cookedPlans: userPlans, today: todayStr() });
  },

  /** 테마 요리 (03-2 3.6, KD-51). 오늘 날짜 기준이라 같은 날에는 같은 테마가 나온다 */
  /** Today 테마 요리. round = 새로고침 횟수 (0 = 오늘 첫 테마) */
  async getThemes(round = 0): Promise<TodayThemeSection[]> {
    const [recipes, ingredients] = await Promise.all([
      recipeService.getRecipes(),
      ingredientService.getIngredients(),
    ]);
    return pickThemes(recipes, todayStr(), { round }).map(({ theme, recipes: themeRecipes }) => ({
      theme,
      items: themeRecipes.map((recipe) => ({
        recipe,
        missingCount: getMissingIngredientNames(recipe, ingredients).length,
      })),
    }));
  },
};

const GUEST_PROFILE: UserProfile = { id: '', name: '', role: 'MEMBER', householdName: '' };

export const authService = {
  isLoggedIn(): boolean {
    return currentUserId !== null;
  },

  /** 로그인한 계정 프로필. 비로그인이면 빈 프로필 */
  getCurrentUser(): UserProfile {
    const account = usersData.find((u) => u.id === currentUserId);
    return account ? { ...toProfile(account), email: auth.currentUser?.email ?? undefined } : { ...GUEST_PROFILE };
  },

  /** 이메일 아이디 로그인: Firebase Auth 이메일/비밀번호 계정으로 확인한다 */
  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    const failed = { success: false, message: '아이디 또는 비밀번호가 맞지 않아요' };
    if (!email || !password) return failed;
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      const appUserId = toAppUserId(user);
      if (!appUserId) {
        // Auth 계정은 있지만 앱 프로필이 없으면 로그인시키지 않는다
        await signOut(auth);
        return failed;
      }
      currentUserId = appUserId; // onAuthStateChanged 보다 먼저 화면이 바뀌어도 맞게
      syncHousehold(user, appUserId); // 화면이 바로 냉장고·장바구니를 읽어도 되도록 구독을 먼저 시작한다
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

  /** 같은 가구 구성원 */
  getHouseholdMembers(): UserProfile[] {
    const householdId = usersData.find((u) => u.id === currentUserId)?.householdId;
    return usersData
      .filter((u) => u.householdId === householdId)
      .map((u) => (u.id === currentUserId ? authService.getCurrentUser() : toProfile(u)));
  },

  logout(): void {
    currentUserId = null;
    notifyListeners();
    signOut(auth).catch((e) => console.error(e));
  },
};
