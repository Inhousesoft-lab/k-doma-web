import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MealPlan, Recipe } from '../../types';

export interface PlanCardProps {
  plan: MealPlan;
  /** 요리 시간·칼로리·탄단지를 보여 줄 레시피 (못 찾으면 해당 줄을 그리지 않는다) */
  recipe?: Recipe;
  onComplete: (planId: string) => void;
  /** 요리 예정 [취소]: 확인 없이 지운다 */
  onCancel: (planId: string) => void;
  /** 요리 완료 [삭제]: 확인 창을 띄운 뒤 지운다 (KD-57) */
  onDelete: (plan: MealPlan) => void;
  onOpenInventorySheet: (plan: MealPlan) => void;
  /** 저장 중이면 버튼을 막는다 (연속 누름 방지) */
  busy?: boolean;
}

/**
 * 선택한 날짜의 요리 카드 컴포넌트 (공용 위치: src/components/plan/PlanCard.tsx)
 * - 요리 예정(PLANNED): [취소] [요리 완료]
 * - 요리 완료(COOKED): 위쪽 줄 오른쪽 끝 [삭제]. 재고 미반영이면 아래 [요리를 완성했어요. 재고 변경할까요?],
 *   반영했으면 칩 옆 '재고 반영됨' (아래 버튼 줄 없음)
 * - 달력 보기·타임라인 보기에서 같이 쓴다
 * - 재고 반영은 한 번만. [다시 수정]은 없다 (KD-57)
 * - 요리명 아래 메타 줄: 요리 시간 · 칼로리 (오늘 탭 요리 카드와 같은 형식)
 * - 영양 데이터가 있으면 탄수화물·단백질·지방 줄을 덧붙인다
 * - 두지 않는 것: 카드 위 제목 줄
 */
export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  recipe,
  onComplete,
  onCancel,
  onDelete,
  onOpenInventorySheet,
  busy = false,
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    navigate(`/recipe/${plan.recipeId}`);
  };

  const isCooked = plan.status === 'COOKED';
  const hasBottomActions = !isCooked || !plan.inventoryUpdated;

  const kcal = recipe?.nutrition?.calories ?? recipe?.caloriesKcal;
  const meta = [
    recipe && recipe.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes}분` : '',
    kcal ? `${kcal} kcal` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  // 사진: 지금 레시피 사진을 먼저 쓴다. 예전에 저장된 기록은 .jpg 경로라 .webp 로 바꿔 쓴다 (사진 WebP 전환)
  const photoUrl = recipe?.photoUrl ?? plan.photoUrl?.replace(/^(\/images\/recipes\/.+)\.jpg$/, '$1.webp') ?? null;

  const macros = recipe?.nutrition
    ? `탄 ${recipe.nutrition.carbs}g · 단 ${recipe.nutrition.protein}g · 지 ${recipe.nutrition.fat}g`
    : '';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-card border border-line p-4 cursor-pointer active:scale-[0.99] transition-all"
    >
      {/* 1. 상단 줄: 칩 (● 요리 완료 / ○ 요리 예정) + 재고 반영됨 ……… 오른쪽 끝 [삭제] (요리 완료만)
             [삭제] 누르는 영역은 44px, 위아래 여백을 겹쳐 줄 높이는 칩 높이로 둔다 */}
      <div className="flex items-center justify-between mb-3 min-h-[26px]">
        <div className="flex items-center gap-2">
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
          {isCooked && plan.inventoryUpdated && (
            <span className="text-[12px] font-bold text-mint flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-mint" />
              재고 반영됨
            </span>
          )}
        </div>
        {isCooked && (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(plan);
            }}
            className="h-[44px] -my-[9px] -mr-2 px-2 text-[13px] text-ink-muted font-bold hover:text-ink cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            삭제
          </button>
        )}
      </div>

      {/* 2. 중간 행: 사각 썸네일(책 사진) + 요리명 */}
      <div className={`flex items-center gap-3.5 ${hasBottomActions ? 'mb-4' : ''}`}>
        <div className="w-[64px] h-[64px] rounded-btn bg-line flex items-center justify-center shrink-0 overflow-hidden text-ink-tertiary font-medium text-[12px]">
          {photoUrl ? (
            <img
              src={photoUrl}
              loading="lazy"
              decoding="async"
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

        <div className="min-w-0">
          <h3 className="text-[19px] font-bold text-ink truncate leading-tight">
            {plan.recipeName}
          </h3>
          {meta && <p className="text-[13px] text-ink-muted mt-1">{meta}</p>}
          {macros && <p className="text-[12px] text-ink-muted mt-0.5">{macros}</p>}
        </div>
      </div>

      {/* 3. 하단 액션 버튼: 요리 예정 [취소][요리 완료] / 요리 완료·재고 미반영 [재고 변경] / 재고 반영됨이면 없음 */}
      {!isCooked ? (
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onCancel(plan.id);
            }}
            className="h-[48px] rounded-[12px] border border-line-strong bg-white hover:bg-fill-subtle text-ink font-bold text-[14px] flex-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            취소
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onComplete(plan.id);
            }}
            className="h-[48px] rounded-[12px] bg-ink hover:bg-black text-white font-bold text-[14px] flex-1 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            요리 완료
          </button>
        </div>
      ) : (
        !plan.inventoryUpdated && (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onOpenInventorySheet(plan);
            }}
            className="w-full h-[48px] rounded-[12px] border border-ink bg-white hover:bg-fill-subtle text-ink font-bold text-[14px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            요리를 완성했어요. 재고 변경할까요?
          </button>
        )
      )}
    </div>
  );
};

export default PlanCard;
