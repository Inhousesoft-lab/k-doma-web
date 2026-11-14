import { Ingredient, Recipe } from '../types';
import { clone, recipesData } from '../data';
import { getMissingIngredientNames } from '../utils/ingredient';
import { loadFavoriteIds, addFavorite as saveFavorite, favoritesReady, removeFavorite } from './favoritesStore';
import { currentUid, favoriteSet, requireUser, waitFavorites } from './session';

// 레시피는 JSON(src/data)을 메모리에 두고 읽기만 한다
// 찜은 계정별로 Firestore(favoritesStore.ts)에 저장한다 (KD-55)
export const inMemoryRecipes: Recipe[] = clone(recipesData);

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
    if (!currentUid()) return [];
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
