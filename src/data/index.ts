/**
 * 데모용 JSON 데이터 (DB 대신 사용)
 * - JSON은 앱을 처음 열 때의 값(시드)만 담는다.
 * - 사용 중에 바뀐 값은 메모리에만 있고, 새로고침하면 JSON 값으로 돌아간다.
 * - 나중에 DB/API로 바꿀 때는 이 파일과 services만 바꾸면 된다.
 */
import { CartItem, Ingredient, MasterIngredient, Recipe } from '../types';
import recipesJson from './recipes.json';
import ingredientsJson from './ingredients.json';
import fridgeJson from './fridge.json';
import cartsJson from './carts.json';

export const recipesData = recipesJson as Recipe[];
export const ingredientsData = ingredientsJson as MasterIngredient[];
/** 가구별 냉장고 예시 (가구 공유, KD-27). 비로그인은 빈 냉장고(KD-47) */
export const fridgeData = fridgeJson as Record<string, Ingredient[]>;
/** 계정별 장바구니 */
export const cartsData = cartsJson as Record<string, CartItem[]>;

/** JSON 원본이 바뀌지 않도록 깊은 복사본을 쓴다 */
export const clone = <T>(value: T): T => structuredClone(value);
