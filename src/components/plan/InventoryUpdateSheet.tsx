import React, { useState, useEffect } from 'react';
import { MealPlan, IngredientStatus } from '../../types';
import {
  recipeService,
  ingredientService,
  mealPlanService,
  InventoryAlreadyAppliedError,
  PlanNotFoundError,
} from '../../services';
import BottomSheet from '../common/BottomSheet';
import StatusSignal from '../common/StatusSignal';
import Button from '../common/Button';
import { findByIngredientName, isSameIngredient, stockIngredientsOf } from '../../utils/ingredient';

export interface InventoryUpdateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MealPlan | null;
  /** 시트를 닫으며 알릴 문구 (예: '이미 재고가 반영됐어요') */
  onNotice: (message: string) => void;
}

interface IngredientItemState {
  name: string;
  usageType: 'ALL' | 'PART';
  /** 냉장고에 등록된 재료인지. 아니면 '냉장고에 없음'으로 보여 주고 반영할 때 새로 추가한다 */
  inFridge: boolean;
  currentStatus: IngredientStatus;
  proposedStatus: IngredientStatus;
  selectedStatus: IngredientStatus;
}

/**
 * 재고 변경 바텀시트 (03-2 6장, KD-57)
 * - 레시피 재료를 모두 보여 준다. 냉장고에 없는 재료도 '냉장고에 없음'으로 보여 준다
 *   (냉장고에 있는데 기록하지 않았을 수 있다)
 * - 제안값: 냉장고에 있음 → ALL 없음 / PART 있음→적음(적음·없음은 그대로)
 *           냉장고에 없음 → ALL 없음 / PART 적음 (요리했으니 있었다고 본다)
 * - [냉장고에 반영]: 냉장고 변경과 '재고 반영됨'을 한 번에 저장한다. 한 번만 반영된다
 */
export const InventoryUpdateSheet: React.FC<InventoryUpdateSheetProps> = ({
  isOpen,
  onClose,
  plan,
  onNotice,
}) => {
  const [items, setItems] = useState<IngredientItemState[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && plan) {
      loadIngredients(plan);
    }
  }, [isOpen, plan]);

  const loadIngredients = async (targetPlan: MealPlan) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [recipe, fridgeIngredients] = await Promise.all([
        recipeService.getRecipeById(targetPlan.recipeId),
        ingredientService.getIngredients(),
      ]);

      // 같은 재료가 두 번 적힌 레시피는 한 줄로 합친다 (먼저 나온 것 기준)
      // 물처럼 항상 있는 재료는 재고 반영 대상에서 뺀다
      const required = (recipe ? stockIngredientsOf(recipe) : []).filter(
        (req, index, list) => list.findIndex((other) => isSameIngredient(other.name, req.name)) === index
      );
      setItems(
        required.map((req) => {
          const match = findByIngredientName(req.name, fridgeIngredients);
          const inFridge = Boolean(match);
          const currentStatus: IngredientStatus = match?.status ?? 'NONE';
          const usageType =
            req.usageType ||
            (req.amount?.includes('포기') || req.amount?.includes('모') || req.amount?.includes('g')
              ? 'ALL'
              : 'PART');

          let proposedStatus: IngredientStatus;
          if (usageType === 'ALL') proposedStatus = 'NONE';
          else if (!inFridge) proposedStatus = 'LOW';
          else proposedStatus = currentStatus === 'HAVE' ? 'LOW' : currentStatus;

          return {
            name: req.name,
            usageType,
            inFridge,
            currentStatus,
            proposedStatus,
            selectedStatus: proposedStatus,
          };
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStatus = (index: number, status: IngredientStatus) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selectedStatus: status };
      return next;
    });
  };

  const handleApply = async () => {
    if (!plan || isSaving) return;
    setIsSaving(true);
    setErrorMessage('');
    try {
      // 냉장고 변경 + '재고 반영됨'을 한 번에 저장 (트랜잭션)
      await mealPlanService.applyInventory(
        plan.id,
        items.map((i) => ({ name: i.name, status: i.selectedStatus }))
      );
      onClose();
    } catch (e) {
      if (e instanceof InventoryAlreadyAppliedError || e instanceof PlanNotFoundError) {
        // 다른 구성원이 먼저 반영했거나 기록을 지웠다
        onNotice(e.message);
        onClose();
        return;
      }
      console.error(e);
      // 실패하면 시트를 닫지 않고 고른 값을 그대로 둔다 (KD-37)
      setErrorMessage('저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="재료 상태 변경">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-ink-muted leading-relaxed">
          요리에 사용한 재료의 남은 상태를 확인하고 냉장고에 바로 반영하세요.
        </p>

        {loading ? (
          <div className="py-8 text-center text-ink-muted text-[14px]">
            재료를 불러오는 중...
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-line-subtle max-h-[360px] overflow-y-auto no-scrollbar">
            {items.map((item, index) => (
              <div key={item.name} className="py-3 flex items-center justify-between gap-3">
                {/* 좁은 화면(360px)에서도 재료 이름이 보이도록 이름 / 사용량·태그를 두 줄로 */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[15px] font-bold text-ink truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-ink-muted">
                      {item.usageType === 'ALL' ? '다 씀' : '일부 씀'}
                    </span>
                    {!item.inFridge && (
                      <span className="text-[11px] font-medium text-ink-tertiary bg-fill px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        냉장고에 없음
                      </span>
                    )}
                  </div>
                </div>

                {/* 상태 선택 라디오 버튼 3종 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(['HAVE', 'LOW', 'NONE'] as IngredientStatus[]).map((st) => {
                    const isSelected = item.selectedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleSelectStatus(index, st)}
                        className={`h-[32px] px-2.5 rounded-[8px] text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-ink text-white shadow-2xs'
                            : 'bg-fill text-ink-muted hover:text-ink'
                        }`}
                      >
                        <StatusSignal status={st} size={11} />
                        <span>{st === 'HAVE' ? '있음' : st === 'LOW' ? '적음' : '없음'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {errorMessage && (
          <p className="text-[13px] font-medium text-danger">{errorMessage}</p>
        )}

        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleApply}
            disabled={isSaving || loading || items.length === 0}
          >
            {isSaving ? '저장 중...' : '냉장고에 반영'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default InventoryUpdateSheet;
