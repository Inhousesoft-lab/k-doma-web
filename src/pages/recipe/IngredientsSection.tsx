import React from 'react';
import { Check, Copy, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Ingredient, Recipe } from '../../types';
import { cartService } from '../../services';
import { fridgeStatusOf } from '../../utils/ingredient';
import { scaleAmount } from '../../utils/amount';
import StatusSignal from '../../components/common/StatusSignal';
import Button from '../../components/common/Button';

interface IngredientsSectionProps {
  recipe: Recipe;
  fridgeIngredients: Ingredient[];
  missingIngredientNames: string[];
  servings: number;
  /** 비로그인은 상태 신호·범례·'양 확인'을 숨긴다 (기획서 4.4) */
  isLoggedIn: boolean;
  handleCopyIngredients: () => void;
  handleServingsChange: (delta: number) => void;
  handleToggleCartItem: (name: string) => void;
  handleAddAllMissingToCart: (names: string[]) => void;
}

/** 요리 상세 '필요한 재료': 인분 조절, 재료별 보유 상태·장바구니, 없는 재료 일괄 담기 */
const IngredientsSection: React.FC<IngredientsSectionProps> = ({
  recipe,
  fridgeIngredients,
  missingIngredientNames,
  servings,
  isLoggedIn,
  handleCopyIngredients,
  handleServingsChange,
  handleToggleCartItem,
  handleAddAllMissingToCart,
}) => (
  <section className="bg-white rounded-card p-4.5 border border-line">
    {/* 헤더: 필요한 재료 + 인분 조절 (−/+) */}
    <div className="flex items-center justify-between mb-3 pb-2 border-b border-line-subtle">
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-[16px] font-bold text-ink">필요한 재료</h3>
          <button
            type="button"
            onClick={handleCopyIngredients}
            className="flex items-center gap-1 px-2 py-1 rounded-[8px] bg-fill text-[12px] font-bold text-ink-secondary cursor-pointer"
            aria-label="재료 복사"
          >
            <Copy className="w-3.5 h-3.5" />
            복사
          </button>
        </div>
        {/* 비로그인 상태에서는 상태 신호 범례 숨김 (기획서 4.4) */}
        {isLoggedIn && (
          <span className="text-[11px] text-ink-muted">
            ● 있음 · ◐ 적음 · ◌ 없음
          </span>
        )}
      </div>

      {/* 인분 수 컨트롤러 (−/+) */}
      <div className="flex items-center gap-2 bg-fill px-2 py-1 rounded-[12px]">
        <button
          type="button"
          onClick={() => handleServingsChange(-1)}
          disabled={servings <= 1}
          className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink disabled:opacity-30 cursor-pointer shadow-2xs"
          aria-label="인분 줄이기"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-[13px] font-bold text-ink min-w-[36px] text-center">
          {servings}인분
        </span>
        <button
          type="button"
          onClick={() => handleServingsChange(1)}
          disabled={servings >= 8}
          className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink disabled:opacity-30 cursor-pointer shadow-2xs"
          aria-label="인분 늘리기"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>

    {/* 재료 목록 행 */}
    <div className="flex flex-col divide-y divide-line-subtle">
      {recipe.ingredientsRequired?.map((item) => {
        // 보유 상태 확인
        const matchedStatus = fridgeStatusOf(item.name, fridgeIngredients);
        const isInCart = cartService.isItemInCart(item.name);
        const scaledQty = scaleAmount(item.amount, servings, recipe.servings || 2);

        return (
          <div
            key={item.name}
            className="py-3 flex items-center justify-between gap-3"
          >
            {/* 좌측: 상태 신호(로그인 상태만) + 재료명(적음이면 '양 확인') */}
            <div className="flex items-center gap-2.5 min-w-0">
              {isLoggedIn && (
                <StatusSignal status={matchedStatus} size={14} />
              )}
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[15px] font-bold text-ink truncate">
                  {item.name}
                </span>
                {isLoggedIn && matchedStatus === 'LOW' && (
                  <span className="text-[11px] font-bold text-warning bg-warning-light px-1.5 py-0.5 rounded-full shrink-0">
                    양 확인
                  </span>
                )}
              </div>
            </div>

            {/* 우측: 수량 + 장바구니 버튼 */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[13px] text-ink-muted">
                {scaledQty}
              </span>

              <button
                type="button"
                onClick={() => handleToggleCartItem(item.name)}
                className={`h-[30px] px-2.5 rounded-full text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isInCart
                    ? 'bg-mint-bg text-mint border border-mint/30'
                    : 'bg-fill text-ink hover:bg-line'
                }`}
                aria-label={isInCart ? '장바구니에서 빼기' : '장바구니에 담기'}
              >
                {isInCart ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>담김</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>담기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>

    {/* 없는 재료 일괄 추가 버튼 */}
    <div className="mt-4 pt-3 border-t border-line-subtle">
      {missingIngredientNames.length > 0 ? (
        <Button
          variant="secondary"
          size="md"
          onClick={() => handleAddAllMissingToCart(missingIngredientNames)}
          icon={<ShoppingBag className="w-4 h-4" />}
        >
          없는 재료 {missingIngredientNames.length}개 모두 장바구니에 추가
        </Button>
      ) : (
        <div className="p-3 bg-mint-bg rounded-btn text-center text-[13px] font-bold text-mint flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>모든 재료가 냉장고에 준비되어 있어요</span>
        </div>
      )}
    </div>
  </section>
);

export default IngredientsSection;
