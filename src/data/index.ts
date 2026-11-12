/**
 * 데모용 JSON 데이터 (DB 대신 사용)
 * - JSON은 앱을 처음 열 때의 값(시드)만 담는다.
 * - 사용 중에 바뀐 값은 메모리에만 있고, 새로고침하면 JSON 값으로 돌아간다.
 * - 나중에 DB/API로 바꿀 때는 이 파일과 services만 바꾸면 된다.
 */
import { CartItem, Ingredient, MasterIngredient, MealPlan, PlanStatus, Recipe, UserProfile } from '../types';
import { addDays, todayStr } from '../utils/date';
import recipesJson from './recipes.json';
import ingredientsJson from './ingredients.json';
import usersJson from './users.json';
import fridgeJson from './fridge.json';
import cartsJson from './carts.json';
import favoritesJson from './favorites.json';
import plansJson from './plans.json';

/** 계정 프로필 (로그인 확인은 Firebase Auth 가 한다. 아이디 = Auth 이메일의 @ 앞부분) */
export interface UserAccount extends UserProfile {
  householdId: string;
}

/** 요리 기록 시드. 날짜는 '오늘로부터 며칠 전'으로 적어 언제 열어도 이번 주 기록이 보이게 한다 */
export interface PlanSeed {
  id: string;
  userId: string;
  daysAgo: number;
  recipeId: string;
  status: PlanStatus;
  inventoryUpdated?: boolean;
}

export const recipesData = recipesJson as Recipe[];
export const ingredientsData = ingredientsJson as MasterIngredient[];
export const usersData = usersJson as UserAccount[];
/** 가구별 냉장고 예시 (가구 공유, KD-27). 비로그인은 빈 냉장고(KD-47) */
export const fridgeData = fridgeJson as Record<string, Ingredient[]>;
/** 계정별 장바구니 */
export const cartsData = cartsJson as Record<string, CartItem[]>;
/** 계정별 찜 (recipeId 목록) */
export const favoritesData = favoritesJson as Record<string, string[]>;
export const planSeeds = plansJson as PlanSeed[];

/** JSON 원본이 바뀌지 않도록 깊은 복사본을 쓴다 */
export const clone = <T>(value: T): T => structuredClone(value);

/** 계정 정보에서 비밀번호를 뺀 프로필 */
export const toProfile = (account: UserAccount): UserProfile => ({
  id: account.id,
  name: account.name,
  role: account.role,
  householdName: account.householdName,
});

/** 기록 시드를 오늘 기준 날짜로 바꾸고, 요리 이름·사진·칼로리는 요리 데이터에서 채운다 */
export const buildPlans = (): MealPlan[] => {
  const today = todayStr();
  return planSeeds.map((seed) => {
    const recipe = recipesData.find((r) => r.id === seed.recipeId);
    return {
      id: seed.id,
      userId: seed.userId,
      date: addDays(today, -seed.daysAgo),
      recipeId: seed.recipeId,
      recipeName: recipe?.name ?? '요리',
      photoUrl: recipe?.photoUrl,
      status: seed.status,
      inventoryUpdated: seed.inventoryUpdated ?? false,
      caloriesKcal: recipe?.caloriesKcal,
    };
  });
};
