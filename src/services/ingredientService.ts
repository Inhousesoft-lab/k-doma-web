import { Ingredient, IngredientStatus, MasterIngredient, StorageZone } from '../types';
import { ingredientsData } from '../data';
import { findByIngredientName, isSameIngredient } from '../utils/ingredient';
import {
  cachedFridge,
  deleteIngredient,
  setIngredientStatus,
  setIngredientZone,
  upsertIngredient,
} from './householdStore';
import { fridge, requireUser } from './session';

export const ingredientService = {
  async getIngredients(): Promise<Ingredient[]> {
    return [...(await fridge())];
  },

  async updateIngredientStatus(id: string, status: IngredientStatus): Promise<Ingredient | undefined> {
    requireUser();
    const item = (await fridge()).find((i) => i.id === id);
    if (!item) return undefined;
    await setIngredientStatus(id, status);
    return { ...item, status };
  },

  /**
   * 아이콘형 탭 시 상태 순환 (있음 -> 적음 -> 없음 -> 있음)
   */
  async cycleIngredientStatus(id: string): Promise<Ingredient | undefined> {
    requireUser();
    const item = (await fridge()).find((i) => i.id === id);
    if (!item) return undefined;
    const nextMap: Record<IngredientStatus, IngredientStatus> = {
      HAVE: 'LOW',
      LOW: 'NONE',
      NONE: 'HAVE',
    };
    const status = nextMap[item.status];
    await setIngredientStatus(id, status);
    return { ...item, status };
  },

  /**
   * 드래그앤드롭으로 구역 옮기기 (양념 선반 ↔ 냉장고). 처음 구역은 재료 사전 분류로 정해지고,
   * 사용자가 옮기면 그 구역을 저장한다. 이후 상태가 바뀌어도(장바구니·요리 완료) 구역은 그대로다.
   */
  async moveIngredientZone(id: string, zone: StorageZone): Promise<boolean> {
    requireUser();
    const item = (await fridge()).find((i) => i.id === id);
    if (!item || item.zone === zone) return false;
    await setIngredientZone(id, zone);
    return true;
  },

  /**
   * 목록형 [빼기] 처리: 냉장고에서 완전히 제거
   */
  async removeIngredient(id: string): Promise<boolean> {
    requireUser();
    if (!(await fridge()).some((i) => i.id === id)) return false;
    await deleteIngredient(id);
    return true;
  },

  /**
   * 재료 추가 시트에서 선택한 재료들 일괄 등록 (기본 상태: 있음 HAVE). 이미 있는 재료는 건너뛴다
   */
  async addIngredients(
    newItems: Array<{ name: string; zone: StorageZone; imageKey?: string | null }>
  ): Promise<Ingredient[]> {
    requireUser();
    const current = await fridge();
    const toAdd = newItems.filter(
      (item, index) =>
        !findByIngredientName(item.name, current) &&
        newItems.findIndex((other) => isSameIngredient(other.name, item.name)) === index
    );
    await Promise.all(
      toAdd.map((item) =>
        upsertIngredient({ name: item.name, zone: item.zone, status: 'HAVE', imageKey: item.imageKey ?? null })
      )
    );
    return toAdd.map((item) => findByIngredientName(item.name, cachedFridge())).filter((i): i is Ingredient => !!i);
  },

  /**
   * 마스터 재료 목록 반환 (검색/추가 시트용)
   */
  async getMasterIngredients(zone?: StorageZone): Promise<MasterIngredient[]> {
    return zone ? ingredientsData.filter((m) => m.zone === zone) : ingredientsData;
  },

};
