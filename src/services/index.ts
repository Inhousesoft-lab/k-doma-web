/**
 * 서비스 창구. 화면은 여기서만 import 한다
 * - 레시피는 JSON(src/data)을 메모리에 두고 읽기만 한다 (recipeService)
 * - 냉장고·장바구니·요리 기록은 가구 단위로 Firestore(householdStore.ts)에 저장한다 (KD-54, KD-57)
 * - 찜은 계정별로 Firestore(favoritesStore.ts)에 저장한다 (KD-55)
 */
export { authReady, authService, LoginRequiredError, subscribeToDataChanges } from './session';
export { recipeService } from './recipeService';
export { ingredientService } from './ingredientService';
export { cartService } from './cartService';
export {
  mealPlanService,
  PLAN_LIMIT_PER_DAY,
  PlanLimitError,
  DuplicatePlanError,
  InventoryAlreadyAppliedError,
  PlanNotFoundError,
  type InventoryChoice,
} from './mealPlanService';
export { recommendationService, type TodayRecipeItem, type TodayThemeSection } from './recommendationService';
export { HouseholdLoadError } from './householdStore';
