import React, { useState, useEffect } from 'react';
import { MealPlan, IngredientStatus } from '../../types';
import { recipeService, ingredientService, mealPlanService } from '../../services';
import BottomSheet from '../common/BottomSheet';
import StatusSignal from '../common/StatusSignal';
import Button from '../common/Button';
import { fridgeStatusOf } from '../../utils/ingredient';

export interface InventoryUpdateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MealPlan | null;
  onSaved: () => void;
}

interface IngredientItemState {
  name: string;
  usageType: 'ALL' | 'PART';
  currentStatus: IngredientStatus;
  proposedStatus: IngredientStatus;
  selectedStatus: IngredientStatus;
}

/**
 * 재고 변경 바텀시트 컴포넌트 (공용 위치: src/components/plan/InventoryUpdateSheet.tsx)
 */
export const InventoryUpdateSheet: React.FC<InventoryUpdateSheetProps> = ({
  isOpen,
  onClose,
  plan,
  onSaved,
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

      if (recipe && recipe.ingredientsRequired) {
        const itemStates: IngredientItemState[] = recipe.ingredientsRequired.map((req) => {
          const currentStatus = fridgeStatusOf(req.name, fridgeIngredients);
          const usageType =
            req.usageType ||
            (req.amount?.includes('포기') || req.amount?.includes('모') || req.amount?.includes('g')
              ? 'ALL'
              : 'PART');

          // 기본 제안값:
          // 다 쓰는 재료(ALL) -> 없음(NONE)
          // 일부 쓰는 재료(PART) -> 있음(HAVE) -> 적음(LOW) (이미 적음이나 없으면 그대로)
          let proposedStatus: IngredientStatus = 'NONE';
          if (usageType === 'ALL') {
            proposedStatus = 'NONE';
          } else {
            proposedStatus = currentStatus === 'HAVE' ? 'LOW' : currentStatus;
          }

          return {
            name: req.name,
            usageType,
            currentStatus,
            proposedStatus,
            selectedStatus: proposedStatus,
          };
        });

        setItems(itemStates);
      }
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
      // 1. 냉장고 재료 상태 일괄 반영 (batch update)
      await ingredientService.batchUpdateStatuses(
        items.map((i) => ({ name: i.name, status: i.selectedStatus }))
      );

      // 2. 계획에 'inventoryUpdated: true' 마킹
      await mealPlanService.markInventoryUpdated(plan.id, true);

      onSaved();
      onClose();
    } catch (e) {
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[15px] font-bold text-ink truncate">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-medium text-ink-muted shrink-0">
                    ({item.usageType === 'ALL' ? '다 씀' : '일부 씀'})
                  </span>
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
