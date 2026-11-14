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

/** 요리 예정 / 요리 완료. 취소·삭제는 기록을 지운다 (KD-57) */
export type PlanStatus = 'PLANNED' | 'COOKED';

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

/** 곁들이는 소스 (예: 허니 마늘 페스토). 요리 상세에서 조리 순서 뒤에 따로 보여준다 */
export interface RecipeSauce {
  name: string;
  /** 소스 재료 표시용. 장보기 계산은 ingredientsRequired 에 함께 넣은 재료로 한다 */
  ingredients?: RecipeIngredientRef[];
  steps: string[];
}

export interface Recipe {
  id: string;
  name: string;
  photoUrl?: string;
  mainIngredient: string; // 닭, 돼지, 소, 해산물·생선, 계란, 두부, 채소 등
  category: string; // 밥, 면·파스타, 국·탕·찌개, 분식, 반찬, 특식, 간식 등
  dishGroupId?: string; // 음식 묶음 (03-2 3.3). 없으면 recipe.id
  themes?: string[]; // Today 테마 (파스타·면·떡볶이·국물·긴급·만원·간식·샌드위치·수프·양식·중식·일식·분식·해산물·소·돼지·닭·스팸·전). 여러 개 가능
  cookTimeMinutes: number;
  caloriesKcal?: number;
  servings?: number; // 기본 인분 (예: 2)
  bookPage?: number; // 책 페이지 (예: 42)
  part?: string; // 책 원문 분류 (예: "Part 1 국·찌개")
  nutrition?: RecipeNutrition; // 영양성분 4칸 (없으면 섹션 통째로 미표시)
  tags?: string[];
  description?: string;
  ingredientsRequired?: RecipeIngredientRef[];
  steps?: string[];
  sauce?: RecipeSauce;
  isFavorite?: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  isUrgent: boolean; // true: '꼭 사야 해요', false: '더 사두면 좋아요'
  checked: boolean;
  zone?: StorageZone;
}

/**
 * 요리 기록 (가구 단위, KD-57). households/{hid}/plans/{date}_{recipeId} (KD-61)
 * 누가 했는지(plannedBy·cookedBy)는 데이터에만 남기고 화면에는 표시하지 않는다 (KD-26)
 */
export interface MealPlan {
  id: string; // `${date}_${recipeId}`
  date: string; // YYYY-MM-DD (Asia/Seoul)
  recipeId: string;
  recipeName: string; // 기록할 때의 요리 이름
  photoUrl: string | null; // 기록할 때의 요리 사진
  status: PlanStatus;
  inventoryUpdated: boolean; // 재고 반영됨 (한 번만, KD-57)
  plannedBy: string;
  plannedAt: number; // ms. 같은 날 카드 순서
  cookedBy?: string;
}


export interface UserProfile {
  id: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  householdName: string;
  email?: string; // 로그인 아이디(이메일). 로그인한 본인 프로필에만 채운다
}

/** 재료 사전 항목 (src/data/ingredients.json) */
export interface MasterIngredient {
  id: string;
  name: string;
  zone: StorageZone;
  imageKey: string | null;
  aliases?: string[];
}
