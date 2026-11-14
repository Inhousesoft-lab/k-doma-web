import { Recipe } from '../types';
import { getMissingIngredientNames } from '../utils/ingredient';
import { todayStr } from '../utils/date';
import { pickThemes, recommend, type RecommendedItem } from '../recommendation';
import { ingredientService } from './ingredientService';
import { mealPlanService } from './mealPlanService';
import { recipeService } from './recipeService';

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
   * 여기서는 레시피·냉장고(비로그인은 빈 냉장고)·가구 기록(KD-57)만 모아 넘긴다.
   */
  async getRecommendations(): Promise<RecommendedItem[]> {
    const [recipes, ingredients, householdPlans] = await Promise.all([
      recipeService.getRecipes(),
      ingredientService.getIngredients(),
      mealPlanService.getPlans(),
    ]);
    return recommend({ recipes, fridge: ingredients, cookedPlans: householdPlans, today: todayStr() });
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
