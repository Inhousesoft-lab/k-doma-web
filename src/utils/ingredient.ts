/**
 * 재료 이름 매칭 유틸
 * 03-2: 같은 재료는 표준 재료(재료 사전) 단위로 한 번만 계산한다.
 * 레시피 재료명('진간장', '배추김치')을 재료 사전의 이름·별칭으로 표준 이름('간장', '김치')에 맞춘 뒤 비교한다.
 * 부분 문자열 비교는 쓰지 않는다('파'가 '양파'와 맞는 문제 방지).
 */
import { Ingredient, IngredientStatus, MasterIngredient, Recipe } from '../types';
import { ingredientsData as masterIngredients } from '../data';

/** 공백과 괄호 설명을 지운 비교용 키 */
function normalize(name: string): string {
  return name.replace(/\(.*?\)/g, '').replace(/\s+/g, '').trim();
}

const masterIndex = new Map<string, MasterIngredient>();
masterIngredients.forEach((m) => {
  masterIndex.set(normalize(m.name), m);
  m.aliases?.forEach((alias) => masterIndex.set(normalize(alias), m));
});

/** 재료 사전에서 찾기 (이름 또는 별칭) */
export function findMasterIngredient(name: string): MasterIngredient | undefined {
  return masterIndex.get(normalize(name));
}

/** 표준 이름. 재료 사전에 없으면 괄호·앞뒤 공백만 정리한 원래 이름 */
export function canonicalName(name: string): string {
  return findMasterIngredient(name)?.name ?? name.replace(/\(.*?\)/g, '').trim();
}

/** 같은 재료면 같은 값이 나오는 저장용 키 (Firestore 문서 id). 표준 이름에서 공백·괄호·'/' 를 뺀다 */
export function ingredientKey(name: string): string {
  return normalize(canonicalName(name)).replace(/\//g, '_');
}

export function isSameIngredient(a: string, b: string): boolean {
  return normalize(canonicalName(a)) === normalize(canonicalName(b));
}

export function findByIngredientName<T extends { name: string }>(name: string, list: T[]): T | undefined {
  return list.find((item) => isSameIngredient(item.name, name));
}

/** 있음·적음은 보유로 본다 (KD-07) */
export function isOwned(status: IngredientStatus | undefined): boolean {
  return status === 'HAVE' || status === 'LOW';
}

/** 냉장고 기준 재료 상태. 미등록은 없음(NONE)으로 본다 (KD-06) */
export function fridgeStatusOf(name: string, fridge: Ingredient[]): IngredientStatus {
  return findByIngredientName(name, fridge)?.status ?? 'NONE';
}

/** 레시피에서 부족한 재료 이름 (같은 표준 재료는 한 번만) */
export function getMissingIngredientNames(recipe: Recipe, fridge: Ingredient[]): string[] {
  const seen = new Set<string>();
  const missing: string[] = [];
  (recipe.ingredientsRequired || []).forEach((req) => {
    const key = normalize(canonicalName(req.name));
    if (seen.has(key)) return;
    seen.add(key);
    if (!isOwned(fridgeStatusOf(req.name, fridge))) {
      missing.push(req.name);
    }
  });
  return missing;
}

/** 레시피 재료 중 적음(LOW)이 하나라도 있는지 (추천 가점용) */
export function hasLowIngredient(recipe: Recipe, fridge: Ingredient[]): boolean {
  return (recipe.ingredientsRequired || []).some((req) => fridgeStatusOf(req.name, fridge) === 'LOW');
}
