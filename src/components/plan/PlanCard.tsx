import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { MealPlan } from '../../types';

export interface PlanCardProps {
  plan: MealPlan;
  onComplete: (planId: string) => void;
  onCancel: (planId: string) => void;
  onOpenInventorySheet: (plan: MealPlan) => void;
}

/**
 * 선택한 날짜의 요리 카드 컴포넌트 (공용 위치: src/components/plan/PlanCard.tsx)
 * - 요리 예정(PLANNED) / 요리 완료(COOKED) 카드
 * - 두지 않는 것: 카드 위 제목 줄, 카드 안 메타 줄 금지
 */
export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onComplete,
  onCancel,
  onOpenInventorySheet,
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    navigate(`/recipe/${plan.recipeId}`);
  };

  const isCooked = plan.status === 'COOKED';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-card border border-line p-4 cursor-pointer active:scale-[0.99] transition-all"
    >
      {/* 1. 상단 칩 (● 요리 완료 / ○ 요리 예정) */}
      <div className="mb-3">
        {isCooked ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink text-white text-[12px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            <span>요리 완료</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-ink text-ink text-[12px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full border border-ink inline-block" />
            <span>요리 예정</span>
          </span>
        )}
      </div>

      {/* 2. 중간 행: 사각 썸네일(책 사진) + 요리명 */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-[64px] h-[64px] rounded-btn bg-line flex items-center justify-center shrink-0 overflow-hidden text-ink-tertiary font-medium text-[12px]">
          {plan.photoUrl ? (
            <img
              src={plan.photoUrl}
              alt={plan.recipeName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span>책 사진</span>
            </div>
          )}
        </div>

        <h3 className="text-[19px] font-bold text-ink truncate leading-tight">
          {plan.recipeName}
        </h3>
      </div>

      {/* 3. 하단 액션 버튼 */}
      <div>
        {!isCooked ? (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(plan.id);
              }}
              className="h-[48px] rounded-[12px] border border-line-strong bg-white hover:bg-fill-subtle text-ink font-bold text-[14px] flex-1 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(plan.id);
              }}
              className="h-[48px] rounded-[12px] bg-ink hover:bg-black text-white font-bold text-[14px] flex-1 flex items-center justify-center transition-colors cursor-pointer"
            >
              요리 완료
            </button>
          </div>
        ) : (
          <div>
            {!plan.inventoryUpdated ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInventorySheet(plan);
                }}
                className="w-full h-[48px] rounded-[12px] border border-ink bg-white hover:bg-fill-subtle text-ink font-bold text-[14px] flex items-center justify-center transition-colors cursor-pointer"
              >
                요리를 완성했어요. 재고 변경할까요?
              </button>
            ) : (
              <div className="flex items-center justify-between text-[13px] px-1 pt-1">
                <span className="font-bold text-mint flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-mint" />
                  재고 반영됨
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInventorySheet(plan);
                  }}
                  className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 수정</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanCard;
