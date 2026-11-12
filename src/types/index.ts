/**
 * K-Doma 타입 정의
 */

export type IngredientStatus = 'HAVE' | 'LOW' | 'NONE';

export type StorageZone = 'SEASONING' | 'FRIDGE';

export interface Ingredient {
  id: string;
  name: string;
  zone: StorageZone;
  status: IngredientStatus;
  imageKey?: string | null;
}

export type PlanStatus = 'PLANNED' | 'COOKED' | 'CANCELED';

export interface RecipeIngredientRef {
  name: string;
  amount?: string;
  usageType?: 'ALL' | 'PART';
}

export interface RecipeNutrition {
  calories: number; // kcal
  carbs: number; // g
  protein: number; // g
  fat: number; // g
}

export interface Recipe {
  id: string;
  name: string;
  photoUrl?: string;
  mainIngredient: string; // 닭, 돼지, 소, 해산물·생선, 계란, 두부, 채소 등
  category: string; // 밥, 면·파스타, 국·탕·찌개, 분식, 반찬, 특식, 간식 등
  cookTimeMinutes: number;
  caloriesKcal?: number;
  servings?: number; // 기본 인분 (예: 2)
  bookPage?: number; // 책 페이지 (예: 42)
  part?: string; // 책 원문 분류 (예: "Part 1 국·찌개")
  isVerified?: boolean; // 조리시간·계량 검증 여부 (false면 '미확인')
  nutrition?: RecipeNutrition; // 영양성분 4칸 (없으면 섹션 통째로 미표시)
  tags?: string[];
  description?: string;
  ingredientsRequired?: RecipeIngredientRef[];
  steps?: string[];
  isFavorite?: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  isUrgent: boolean; // true: '꼭 사야 해요', false: '더 사두면 좋아요'
  checked: boolean;
  zone?: StorageZone;
}

export interface MealPlan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  recipeId: string;
  recipeName: string;
  photoUrl?: string;
  status: PlanStatus;
  inventoryUpdated?: boolean;
  caloriesKcal?: number;
}


export interface UserProfile {
  id: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  householdName: string;
}

/** 재료 사전 항목 (src/data/ingredients.json) */
export interface MasterIngredient {
  id: string;
  name: string;
  zone: StorageZone;
  imageKey: string | null;
  aliases?: string[];
}
