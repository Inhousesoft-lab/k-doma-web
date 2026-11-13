/**
 * Today 테마 요리 (03-2 3.6, KD-51) — 순수 함수만 둔다.
 * - 요리가 1개 이상인 테마는 모두 후보 (최소 개수 규칙 없음)
 * - 오늘 날짜를 시드로 한 랜덤: 같은 날에는 같은 테마·같은 순서
 * - 테마는 레시피 단위 (음식 묶음으로 줄이지 않는다)
 * - 새로고침(round)마다 오늘 섞은 테마 순서에서 다음 테마로 넘어간다.
 *   후보를 한 바퀴 다 보기 전에는 같은 테마가 다시 나오지 않는다.
 */
import { Recipe } from '../types';
import { THEMES, THEME_COUNT, THEME_MAX_RECIPES } from './policy';

export interface ThemeSection {
  theme: string;
  recipes: Recipe[];
}

/** 문자열 → 32비트 시드 (FNV-1a) */
function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 시드 랜덤 (mulberry32). 0 이상 1 미만 */
export function seededRandom(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 시드로 섞은 새 배열 (Fisher–Yates) */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = seededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickThemes(
  recipes: Recipe[],
  today: string,
  {
    themeCount = THEME_COUNT,
    maxRecipes = THEME_MAX_RECIPES,
    round = 0,
  }: { themeCount?: number; maxRecipes?: number; /** 새로고침 횟수 (0 = 오늘 첫 테마) */ round?: number } = {}
): ThemeSection[] {
  const candidates = THEMES.map((theme) => ({
    theme: theme as string,
    // 테마에 속하면 재료 정보 유무와 상관없이 모두 노출한다
    recipes: recipes.filter((r) => r.themes?.includes(theme)),
  })).filter((section) => section.recipes.length > 0);

  const ordered = seededShuffle(candidates, `${today}:themes`);
  const count = Math.min(themeCount, ordered.length);
  const start = ordered.length > 0 ? (((round * count) % ordered.length) + ordered.length) % ordered.length : 0;

  return Array.from({ length: count }, (_, i) => ordered[(start + i) % ordered.length])
    .map(({ theme, recipes: themeRecipes }) => ({
      theme,
      recipes: seededShuffle(themeRecipes, `${today}:${theme}`).slice(0, maxRecipes),
    }));
}
