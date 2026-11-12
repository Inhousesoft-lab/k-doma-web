import React from 'react';
import { IngredientStatus } from '../../types';
import StatusSignal from '../../components/common/StatusSignal';

export interface ExtraIngredientItem {
  id: string;
  name: string;
  status: IngredientStatus;
}

export interface CartExtraRowProps {
  item: ExtraIngredientItem;
  onMoveToUrgent: (name: string) => void;
}

/**
 * '더 사두면 좋아요' 행 컴포넌트
 * - 대상: 냉장고에 등록된 재료 중 적음·없음 (KD-35)
 * - 좌측: 상태 신호 (◐ 적음 / ◌ 없음)
 * - 중앙: 재료명
 * - 우측: [+ 살 목록에] 버튼 (누르면 꼭 사야 해요로 이동)
 */
export const CartExtraRow: React.FC<CartExtraRowProps> = ({
  item,
  onMoveToUrgent,
}) => {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line-subtle last:border-b-0">
      {/* 1. 좌측: 상태 신호 + 재료명 */}
      <div className="flex items-center flex-1 min-w-0 mr-3 select-none">
        <div className="w-[22px] flex items-center justify-center shrink-0">
          <StatusSignal status={item.status} size={15} />
        </div>
        <span className="text-[15px] font-medium text-ink ml-3 truncate">
          {item.name}
        </span>
      </div>

      {/* 2. 우측: [+ 살 목록에] 버튼 */}
      <button
        type="button"
        onClick={() => onMoveToUrgent(item.name)}
        className="border border-ink rounded-[10px] px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-fill-subtle active:scale-95 transition-all shrink-0 cursor-pointer select-none"
        title={`${item.name} 살 목록에 추가`}
      >
        + 살 목록에
      </button>
    </div>
  );
};

export default CartExtraRow;
