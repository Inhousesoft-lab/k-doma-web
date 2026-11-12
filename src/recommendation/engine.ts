/**
 * 추천 엔진 (03-2 3장, KD-50) — 순수 함수만 둔다.
 * Firebase·services·data 를 import 하지 않는다. 입력을 받아 결과만 돌려준다.
 *
 * - 냉장고가 비어 있어도 추천한다. 부족 수로 거르거나 그룹을 나누지 않는다.
 * - 음식 묶음(dishGroupId)마다 레시피 1개: 보유율이 가장 높은 레시피.
 * - score = 100 + cookedPenalty(묶음 단위) + 보유율 × 10 + LOW 가점
 * - 영양성분은 점수에 쓰지 않는다.
 */
import { Ingredient, MealPlan, Recipe } from '../types';
import {
  fridgeStatusOf,
  getMissingIngredientNames,
  hasLowIngredient,
  ingredientKey,
  isOwned,
} from '../utils/ingredient';
import { daysBetween, weekStartOf } from '../utils/date';
import {
  COOKED_PENALTY_BY_WEEKS_AGO,
  LOW_BONUS,
  SCORE_BASE,
  STOCK_BONUS_MAX,
} from './policy';

export interface RecommendationInput {
  recipes: Recipe[];
  fridge: Ingredient[];
  /** 내 계정 기록. 엔진 안에서 status === 'COOKED' && date <= today 만 쓴다 */
  cookedPlans: MealPlan[];
  /** YYYY-MM-DD */
  today: string;
}

export interface RecommendedItem {
  /** 묶음에서 고른 레시피 */
  recipe: Recipe;
  dishGroupId: string;
  score: number;
  /** 0~1 */
  ownedRatio: number;
  missingCount: number;
  missingIngredientNames: string[];
  hasLow: boolean;
}

/** 음식 묶음 id. 지정하지 않은 레시피는 혼자 한 묶음 */
export function dishGroupOf(recipe: Recipe): string {
  return recipe.dishGroupId || recipe.id;
}

/** 보유율 = 보유(HAVE·LOW) 재료 종류 수 ÷ 필요 재료 종류 수. 같은 표준 재료는 한 번만. 필요 재료 0개면 0 */
export function ownedRatio(recipe: Recipe, fridge: Ingredient[]): number {
  const statusByKey = new Map<string, boolean>();
  (recipe.ingredientsRequired || []).forEach((req) => {
    const key = ingredientKey(req.name);
    if (!statusByKey.has(key)) statusByKey.set(key, isOwned(fridgeStatusOf(req.name, fridge)));
  });
  if (statusByKey.size === 0) return 0;
  const owned = [...statusByKey.values()].filter(Boolean).length;
  return owned / statusByKey.size;
}

/** 동점 정렬: 조리시간 짧은 순 → 이름 → recipeId (KD-R04) */
function compareRecipes(a: Recipe, b: Recipe): number {
  return (
    a.cookTimeMinutes - b.cookTimeMinutes ||
    a.name.localeCompare(b.name, 'ko') ||
    a.id.localeCompare(b.id)
  );
}

/** 묶음 안에서 보유율이 가장 높은 레시피. 같으면 조리시간 → 이름 → recipeId */
export function pickRecipeInGroup(
  recipes: Recipe[],
  fridge: Ingredient[]
): { recipe: Recipe; ratio: number } {
  return recipes
    .map((recipe) => ({ recipe, ratio: ownedRatio(recipe, fridge) }))
    .sort((a, b) => b.ratio - a.ratio || compareRecipes(a.recipe, b.recipe))[0];
}

/** 가장 최근 COOKED 기록이 속한 주 하나만 감점한다 (KD-R03) */
function cookedPenalty(latestCookedDate: string | undefined, today: string): number {
  if (!latestCookedDate) return 0;
  const weeksAgo = daysBetween(weekStartOf(latestCookedDate), weekStartOf(today)) / 7;
  return COOKED_PENALTY_BY_WEEKS_AGO[weeksAgo] ?? 0;
}

/** 묶음 단위 이력 감점: 같은 묶음의 어느 레시피든 가장 최근 COOKED 기록 기준 */
export function cookedPenaltyForGroup(
  groupRecipeIds: Set<string>,
  cookedPlans: MealPlan[],
  today: string
): number {
  let latest: string | undefined;
  cookedPlans.forEach((p) => {
    if (p.status !== 'COOKED' || p.date > today || !groupRecipeIds.has(p.recipeId)) return;
    if (!latest || p.date > latest) latest = p.date;
  });
  return cookedPenalty(latest, today);
}

export function scoreOf(penalty: number, ratio: number, hasLow: boolean): number {
  return SCORE_BASE + penalty + ratio * STOCK_BONUS_MAX + (hasLow ? LOW_BONUS : 0);
}

/** 점수 높은 순 → 조리시간 → 이름 → recipeId */
export function compareItems(a: RecommendedItem, b: RecommendedItem): number {
  return b.score - a.score || compareRecipes(a.recipe, b.recipe);
}

export function recommend({ recipes, fridge, cookedPlans, today }: RecommendationInput): RecommendedItem[] {
  const groups = new Map<string, Recipe[]>();
  recipes.forEach((recipe) => {
    const id = dishGroupOf(recipe);
    const list = groups.get(id);
    if (list) list.push(recipe);
    else groups.set(id, [recipe]);
  });

  const items: RecommendedItem[] = [];
  groups.forEach((groupRecipes, dishGroupId) => {
    const { recipe, ratio } = pickRecipeInGroup(groupRecipes, fridge);
    const missingIngredientNames = getMissingIngredientNames(recipe, fridge);
    const hasLow = hasLowIngredient(recipe, fridge);
    const penalty = cookedPenaltyForGroup(new Set(groupRecipes.map((r) => r.id)), cookedPlans, today);
    items.push({
      recipe,
      dishGroupId,
      score: scoreOf(penalty, ratio, hasLow),
      ownedRatio: ratio,
      missingCount: missingIngredientNames.length,
      missingIngredientNames,
      hasLow,
    });
  });

  return items.sort(compareItems);
}
