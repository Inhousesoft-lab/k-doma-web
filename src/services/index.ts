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
  cartsData,
  clone,
  favoritesData,
  fridgeData,
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
  hasLowIngredient,
  isSameIngredient,
} from '../utils/ingredient';
import { daysBetween, todayStr, weekStartOf } from '../utils/date';

// 메모리 저장소: 앱을 열 때 JSON(src/data)으로 채우고, 바뀐 값은 메모리에만 둔다 (새로고침하면 초기화)
const inMemoryRecipes: Recipe[] = clone(recipesData);
const fridges: Record<string, Ingredient[]> = clone(fridgeData); // 가구별 냉장고 (가구 공유)
const userCarts: Record<string, CartItem[]> = clone(cartsData); // 계정별 장바구니
const userFavorites: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(favoritesData).map(([userId, ids]) => [userId, new Set(ids)])
); // 계정별 찜 (KD-27)
const inMemoryPlans: MealPlan[] = buildPlans(); // 계정별 요리 기록

// 로그인 상태: 처음엔 로그아웃. 로그인한 계정 id는 sessionStorage에 두어 새로고침해도 유지한다 (탭을 닫으면 풀림)
const SESSION_KEY = 'kdoma.userId';
const readSession = (): string | null => {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    return id && usersData.some((u) => u.id === id) ? id : null;
  } catch {
    return null;
  }
};
const writeSession = (id: string | null) => {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 저장소를 못 쓰는 환경이면 이번 화면에서만 로그인 유지
  }
};
let currentUserId: string | null = readSession();

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

/** 지금 계정이 속한 가구의 냉장고 */
const GUEST_FRIDGE_ID = 'guest';
const fridge = (): Ingredient[] => {
  // 비로그인: 기본 냉장고(fridge.json 의 guest)로 Today 추천·요리 목록 부족 재료를 계산한다. 바꾸기는 로그인 필요
  const householdId = usersData.find((u) => u.id === currentUserId)?.householdId ?? GUEST_FRIDGE_ID;
  if (!fridges[householdId]) fridges[householdId] = [];
  return fridges[householdId];
};

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

const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

/** 재료 사전 기준 구역. 사전에 없으면 냉장고 */
const zoneOf = (name: string): StorageZone => findMasterIngredient(name)?.zone ?? 'FRIDGE';

/** 냉장고에 '있음'으로 등록. 이미 있으면(있음·적음·없음) 있음으로 바꾼다 (KD-28) */
const registerAsHave = (name: string) => {
  const match = findByIngredientName(name, fridge());
  if (match) {
    match.status = 'HAVE';
    return;
  }
  const master = findMasterIngredient(name);
  fridge().push({
    id: newId('ing'),
    name: master?.name ?? canonicalName(name),
    zone: master?.zone ?? 'FRIDGE',
    status: 'HAVE',
    imageKey: master?.imageKey ?? null,
  });
};

const getUserCart = (userId: string): CartItem[] => {
  if (!userCarts[userId]) userCarts[userId] = [];
  return userCarts[userId];
};

export const recipeService = {
  async getRecipes(): Promise<Recipe[]> {
    return inMemoryRecipes.map((r) => ({
      ...r,
      isFavorite: userFavorites[uid()]?.has(r.id) ?? false,
    }));
  },

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const r = inMemoryRecipes.find((recipe) => recipe.id === id);
    if (!r) return undefined;
    return { ...r, isFavorite: userFavorites[uid()]?.has(r.id) ?? false };
  },

  async getFavoriteRecipes(userId: string = uid()): Promise<Recipe[]> {
    const favSet = userFavorites[userId] || new Set();
    return inMemoryRecipes.filter((r) => favSet.has(r.id)).map((r) => ({ ...r, isFavorite: true }));
  },

  async toggleFavorite(id: string, userId: string = uid()): Promise<boolean> {
    requireUser();
    if (!userFavorites[userId]) {
      userFavorites[userId] = new Set();
    }
    const set = userFavorites[userId];
    const nextState = !set.has(id);
    if (nextState) set.add(id);
    else set.delete(id);
    notifyListeners();
    return nextState;
  },

  isFavorite(id: string, userId: string = uid()): boolean {
    return userFavorites[userId]?.has(id) ?? false;
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
    return [...fridge()];
  },

  async updateIngredientStatus(id: string, status: IngredientStatus): Promise<Ingredient | undefined> {
    requireUser();
    const item = fridge().find((i) => i.id === id);
    if (!item) return undefined;
    item.status = status;
    notifyListeners();
    return { ...item };
  },

  /**
   * 아이콘형 탭 시 상태 순환 (있음 -> 적음 -> 없음 -> 있음)
   */
  async cycleIngredientStatus(id: string): Promise<Ingredient | undefined> {
    requireUser();
    const item = fridge().find((i) => i.id === id);
    if (!item) return undefined;
    const nextMap: Record<IngredientStatus, IngredientStatus> = {
      HAVE: 'LOW',
      LOW: 'NONE',
      NONE: 'HAVE',
    };
    item.status = nextMap[item.status];
    notifyListeners();
    return { ...item };
  },

  /**
   * 목록형 [빼기] 처리: 냉장고에서 완전히 제거
   */
  async removeIngredient(id: string): Promise<boolean> {
    requireUser();
    const list = fridge();
    const index = list.findIndex((i) => i.id === id);
    if (index < 0) return false;
    list.splice(index, 1);
    notifyListeners();
    return true;
  },

  /**
   * 재료 추가 시트에서 선택한 재료들 일괄 등록 (기본 상태: 있음 HAVE)
   */
  async addIngredients(
    newItems: Array<{ name: string; zone: StorageZone; imageKey?: string | null }>
  ): Promise<Ingredient[]> {
    requireUser();
    const addedList: Ingredient[] = [];
    newItems.forEach((item) => {
      if (findByIngredientName(item.name, fridge())) return;
      const newIng: Ingredient = {
        id: newId('ing'),
        name: item.name,
        zone: item.zone,
        status: 'HAVE',
        imageKey: item.imageKey || null,
      };
      fridge().push(newIng);
      addedList.push(newIng);
    });

    if (addedList.length > 0) {
      notifyListeners();
    }
    return addedList;
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
    updates.forEach((update) => {
      const match = findByIngredientName(update.name, fridge());
      if (match) {
        match.status = update.status;
      }
    });
    notifyListeners();
  },
};

export const cartService = {
  async getCartItems(userId: string = uid()): Promise<CartItem[]> {
    return [...getUserCart(userId)];
  },

  async getCartCount(userId: string = uid()): Promise<number> {
    return (userCarts[userId] || []).length;
  },

  isItemInCart(name: string, userId: string = uid()): boolean {
    return Boolean(findByIngredientName(name, userCarts[userId] || []));
  },

  async toggleItemCheck(id: string, userId: string = uid()): Promise<void> {
    requireUser();
    const item = getUserCart(userId).find((i) => i.id === id);
    if (item) {
      item.checked = !item.checked;
      notifyListeners();
    }
  },

  /**
   * 재료를 장바구니에 담거나 빼기 ('꼭 사야 해요')
   * 같은 재료는 표준 이름 한 줄로 합친다 (KD-R05)
   */
  async toggleItem(name: string, isUrgent: boolean = true, userId: string = uid()): Promise<boolean> {
    requireUser();
    const list = getUserCart(userId);
    const existingIndex = list.findIndex((i) => isSameIngredient(i.name, name));

    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      notifyListeners();
      return false;
    }
    list.push({
      id: newId('cart'),
      name: canonicalName(name),
      isUrgent,
      checked: false,
      zone: zoneOf(name),
    });
    notifyListeners();
    return true;
  },

  /**
   * 여러 재료 한 번에 장바구니에 담기
   */
  async addItems(names: string[], isUrgent: boolean = true, userId: string = uid()): Promise<number> {
    requireUser();
    const list = getUserCart(userId);
    let addedCount = 0;
    names.forEach((name) => {
      if (findByIngredientName(name, list)) return;
      list.push({
        id: newId('cart'),
        name: canonicalName(name),
        isUrgent,
        checked: false,
        zone: zoneOf(name),
      });
      addedCount++;
    });

    if (addedCount > 0) {
      notifyListeners();
    }
    return addedCount;
  },

  /**
   * [집에 있어요]: 냉장고에 '있음(HAVE)'으로 저장하고 장바구니에서 지운다.
   */
  async markAsInFridge(itemName: string, cartItemId: string, userId: string = uid()): Promise<void> {
    requireUser();
    registerAsHave(itemName);
    userCarts[userId] = getUserCart(userId).filter((i) => i.id !== cartItemId);
    notifyListeners();
  },

  /**
   * [+ 살 목록에]: 더 사두면 좋아요에서 꼭 사야 해요로 옮긴다.
   */
  async moveToUrgentCart(itemName: string, userId: string = uid()): Promise<void> {
    requireUser();
    const list = getUserCart(userId);
    const existing = findByIngredientName(itemName, list);
    if (existing) {
      existing.isUrgent = true;
    } else {
      list.push({
        id: newId('cart'),
        name: canonicalName(itemName),
        isUrgent: true,
        checked: false,
        zone: zoneOf(itemName),
      });
    }
    notifyListeners();
  },

  /**
   * [체크한 n개 냉장고에 등록]:
   * 체크한 재료를 냉장고에 '있음(HAVE)'으로 저장하고, 저장된 항목만 목록에서 지운다.
   * 실패한 항목은 체크된 채로 남김 (KD-36).
   */
  async registerCheckedToFridge(
    itemIds: string[],
    userId: string = uid()
  ): Promise<{ successIds: string[]; failedIds: string[] }> {
    requireUser();
    const list = getUserCart(userId);
    const successIds: string[] = [];
    const failedIds: string[] = [];

    list
      .filter((i) => itemIds.includes(i.id))
      .forEach((item) => {
        try {
          registerAsHave(item.name);
          successIds.push(item.id);
        } catch {
          failedIds.push(item.id);
        }
      });

    const successSet = new Set(successIds);
    userCarts[userId] = list.filter((i) => !successSet.has(i.id));

    notifyListeners();
    return { successIds, failedIds };
  },

  /**
   * 냉장고에 등록된 재료 중 적음·없음 (더 사두면 좋아요, KD-35)
   * 이미 꼭 사야 해요에 있는 재료는 제외
   */
  async getNeedBuyFromFridge(
    userId: string = uid()
  ): Promise<Array<{ id: string; name: string; status: IngredientStatus; zone: StorageZone }>> {
    const cartList = userCarts[userId] || [];
    return fridge()
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

export interface RecommendationResult {
  readyRecipes: Array<{
    recipe: Recipe;
    missingCount: 0;
  }>;
  needBuyRecipes: Array<{
    recipe: Recipe;
    missingCount: number;
    missingIngredientNames: string[];
  }>;
  isFridgeEmpty: boolean;
}

// 03-2 3.3 추천 점수 (v1 초기 정책값)
const SCORE_BASE = 100;
const COOKED_PENALTY_BY_WEEKS_AGO = [-50, -30, -10]; // 이번 주 / 전주 / 2주 전
const LOW_BONUS = 5;

/** 가장 최근 COOKED 기록이 속한 주 하나만 감점한다 (KD-R03) */
const cookedPenalty = (latestCookedDate: string | undefined, today: string): number => {
  if (!latestCookedDate) return 0;
  const weeksAgo = daysBetween(weekStartOf(latestCookedDate), weekStartOf(today)) / 7;
  return COOKED_PENALTY_BY_WEEKS_AGO[weeksAgo] ?? 0;
};

/** 같은 그룹 안 정렬: 점수 높은 순 → 조리시간 짧은 순 → 이름 → recipeId (KD-R04) */
const compareScored = (
  a: { recipe: Recipe; score: number },
  b: { recipe: Recipe; score: number }
): number =>
  b.score - a.score ||
  a.recipe.cookTimeMinutes - b.recipe.cookTimeMinutes ||
  a.recipe.name.localeCompare(b.recipe.name, 'ko') ||
  a.recipe.id.localeCompare(b.recipe.id);

export const recommendationService = {
  /**
   * 현재 냉장고 재고 기준 추천 (03-2 3장)
   * - 부족 재료 0개: '지금 바로 만들 수 있어요'
   * - 부족 재료 1~2개: '1~2개만 사면 돼요'
   * - 부족 재료 3개 이상: Today에서 제외
   * - 그룹 안 정렬: 100 + 이력 감점(내 COOKED 기록) + 적음 가점
   */
  async getRecommendations(userId: string = uid()): Promise<RecommendationResult> {
    const [recipes, ingredients, userPlans] = await Promise.all([
      recipeService.getRecipes(),
      ingredientService.getIngredients(),
      mealPlanService.getUserPlans(userId),
    ]);

    if (ingredients.length === 0) {
      return { readyRecipes: [], needBuyRecipes: [], isFridgeEmpty: true };
    }

    const today = todayStr();
    const latestCookedByRecipe = new Map<string, string>();
    userPlans
      .filter((p) => p.status === 'COOKED' && p.date <= today)
      .forEach((p) => {
        const prev = latestCookedByRecipe.get(p.recipeId);
        if (!prev || p.date > prev) latestCookedByRecipe.set(p.recipeId, p.date);
      });

    const readyList: Array<{ recipe: Recipe; score: number }> = [];
    const needBuyList: Array<{ recipe: Recipe; score: number; missingNames: string[] }> = [];

    recipes.forEach((recipe) => {
      const missingNames = getMissingIngredientNames(recipe, ingredients);
      const score =
        SCORE_BASE +
        cookedPenalty(latestCookedByRecipe.get(recipe.id), today) +
        (hasLowIngredient(recipe, ingredients) ? LOW_BONUS : 0);

      if (missingNames.length === 0) {
        readyList.push({ recipe, score });
      } else if (missingNames.length <= 2) {
        needBuyList.push({ recipe, score, missingNames });
      }
    });

    readyList.sort(compareScored);
    needBuyList.sort(compareScored);

    return {
      readyRecipes: readyList.map(({ recipe }) => ({ recipe, missingCount: 0 as const })),
      needBuyRecipes: needBuyList.map(({ recipe, missingNames }) => ({
        recipe,
        missingCount: missingNames.length,
        missingIngredientNames: missingNames,
      })),
      isFridgeEmpty: false,
    };
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
    return account ? toProfile(account) : { ...GUEST_PROFILE };
  },

  /** 데모 로그인: src/data/users.json 의 아이디·비밀번호와 비교 */
  async login(userId: string, password: string): Promise<{ success: boolean; message?: string }> {
    const account = usersData.find((u) => u.id === userId);
    if (account && account.password === password) {
      currentUserId = account.id;
      writeSession(account.id);
      notifyListeners();
      return { success: true };
    }
    return { success: false, message: '아이디 또는 비밀번호가 맞지 않아요' };
  },

  /** 같은 가구 구성원 */
  getHouseholdMembers(): UserProfile[] {
    const householdId = usersData.find((u) => u.id === currentUserId)?.householdId;
    return usersData.filter((u) => u.householdId === householdId).map(toProfile);
  },

  logout(): void {
    currentUserId = null;
    writeSession(null);
    notifyListeners();
  },
};
