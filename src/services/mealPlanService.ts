import { IngredientStatus, MealPlan } from '../types';
import { canonicalName, findByIngredientName, findMasterIngredient } from '../utils/ingredient';
import {
  applyInventory as saveInventory,
  cachedPlans,
  createPlan,
  deletePlan as removePlan,
  extendPlansFrom,
  plansLoadedFrom,
  DuplicatePlanError,
  InventoryAlreadyAppliedError,
  markPlanCooked as saveCooked,
  PlanNotFoundError,
  type InventoryWrite,
} from './householdStore';
import { inMemoryRecipes } from './recipeService';
import { currentUid, fridge, plans, requireUser } from './session';
import { SERVICE_START_MONTH, addMonths } from '../utils/date';

/** 하루에 기록할 수 있는 요리 수 (가구 기준, KD-57). 앱에서만 확인한다 */
export const PLAN_LIMIT_PER_DAY = 10;

/** 오늘 기록이 10개라 더 추가할 수 없다 */
export class PlanLimitError extends Error {
  constructor() {
    super(`하루에 ${PLAN_LIMIT_PER_DAY}개까지 기록할 수 있어요`);
    this.name = 'PlanLimitError';
  }
}

export { DuplicatePlanError, InventoryAlreadyAppliedError, PlanNotFoundError };

/** 재고 시트의 재료 하나: 사용자가 고른 최종 상태 */
export interface InventoryChoice {
  name: string;
  status: IngredientStatus;
}

export const mealPlanService = {
  /**
   * 받은 범위의 가구 기록 (날짜순, 같은 날은 추가한 순). 비로그인은 빈 목록
   * 로그인하면 지난달 1일부터 받는다. 이전 달은 ensurePlansFrom / loadOlderCookedMonth 로 더 받는다
   */
  async getPlans(): Promise<MealPlan[]> {
    return [...(await plans())];
  },

  /** 그날 기록 (추가한 순) */
  async getPlansByDate(date: string): Promise<MealPlan[]> {
    return (await plans()).filter((p) => p.date === date);
  },

  /**
   * 요리 상세 [오늘 기록에 추가]: 덮어쓰지 않고 추가한다 (KD-57)
   * - 하루 10개면 PlanLimitError
   * - 같은 날 같은 요리가 있으면 DuplicatePlanError (문서 id = 날짜_요리id, KD-61)
   */
  async addPlan(date: string, recipeId: string): Promise<void> {
    requireUser();
    const recipe = inMemoryRecipes.find((r) => r.id === recipeId);
    if (!recipe) throw new Error('요리를 찾을 수 없어요');
    const dayPlans = (await plans()).filter((p) => p.date === date);
    if (dayPlans.some((p) => p.recipeId === recipeId)) throw new DuplicatePlanError();
    if (dayPlans.length >= PLAN_LIMIT_PER_DAY) throw new PlanLimitError();
    await createPlan({ date, recipeId, recipeName: recipe.name, photoUrl: recipe.photoUrl ?? null });
  },

  /** [요리 완료] → COOKED. 가구 추천 감점에 바로 반영된다 */
  async markPlanCooked(planId: string): Promise<void> {
    requireUser();
    await saveCooked(planId);
  },

  /** 요리 예정 [취소]·요리 완료 [삭제]: 기록을 지운다. 냉장고 재고는 되돌리지 않는다 (KD-57) */
  async deletePlan(planId: string): Promise<void> {
    requireUser();
    await removePlan(planId);
  },

  /**
   * 재고 반영 (한 번만, KD-57). 고른 상태를 냉장고에 저장하고 '재고 반영됨'을 함께 표시한다.
   * - 냉장고에 있는 재료: 상태가 바뀐 것만 저장
   * - 냉장고에 없는 재료: 고른 상태로 새로 추가 (구역은 재료 사전, 없으면 냉장고)
   * - 이미 반영된 기록이면 InventoryAlreadyAppliedError
   */
  async applyInventory(planId: string, choices: InventoryChoice[]): Promise<void> {
    requireUser();
    const current = await fridge();
    const writes = choices.flatMap(({ name, status }): InventoryWrite[] => {
      const match = findByIngredientName(name, current);
      if (match) {
        if (match.status === status) return [];
        return [{ existingId: match.id, upsert: { name: match.name, zone: match.zone, status, imageKey: match.imageKey } }];
      }
      const master = findMasterIngredient(name);
      return [
        {
          upsert: {
            name: master?.name ?? canonicalName(name),
            zone: master?.zone ?? 'FRIDGE',
            status,
            imageKey: master?.imageKey ?? null,
          },
        },
      ];
    });
    await saveInventory(planId, writes);
  },

  /** 받은 범위의 시작일 (YYYY-MM-01). 비로그인·구독 전은 null */
  plansLoadedFrom(): string | null {
    return currentUid() ? plansLoadedFrom() : null;
  },

  /** 서비스 시작 달보다 이전 달이 남아 있어 더 받을 수 있다 */
  canLoadMorePlans(): boolean {
    const from = this.plansLoadedFrom();
    return from !== null && from > SERVICE_START_MONTH;
  },

  /** 그 날짜가 속한 달부터 받는다 (서비스 시작 달보다 앞이면 시작 달부터). 비로그인은 아무것도 안 한다 */
  async ensurePlansFrom(date: string): Promise<void> {
    if (!currentUid()) return;
    const monthStart = addMonths(date, 0);
    await extendPlansFrom(monthStart < SERVICE_START_MONTH ? SERVICE_START_MONTH : monthStart);
  },

  /**
   * 타임라인 [더 보기]: 한 달씩 더 받는다. 새로 받은 달에 요리 완료가 없으면 다음 달로 계속,
   * 서비스 시작 달에 닿으면 멈춘다 (눌렀는데 아무것도 안 느는 일이 없게)
   * 반환: 요리 완료가 있는 달을 찾았으면 true, 끝까지 없으면 false
   */
  async loadOlderCookedMonth(): Promise<boolean> {
    while (this.canLoadMorePlans()) {
      const to = this.plansLoadedFrom()!;
      const from = addMonths(to, -1);
      await extendPlansFrom(from);
      const found = cachedPlans().some((p) => p.status === 'COOKED' && p.date >= from && p.date < to);
      if (found) return true;
    }
    return false;
  },

  /** 메모리에 있는 기록에서 바로 찾는다 (구독 전이면 undefined) */
  findCachedPlan(planId: string): MealPlan | undefined {
    return cachedPlans().find((p) => p.id === planId);
  },
};
