import React from 'react';
import { Check } from 'lucide-react';
import { CartItem } from '../../types';

export interface CartUrgentRowProps {
  item: CartItem;
  onToggleCheck: (id: string) => void;
  onMarkInFridge: (item: CartItem) => void;
}

/**
 * '꼭 사야 해요' 행 컴포넌트
 * - 좌측: 체크박스 (체크는 샀다 표시, 즉시 재고 변경 안 됨)
 * - 중앙: 재료명 (출처 요리명 미표시, KD-36)
 * - 우측: [집에 있어요] 버튼 (냉장고에 있음으로 저장 후 목록에서 삭제)
 */
export const CartUrgentRow: React.FC<CartUrgentRowProps> = ({
  item,
  onToggleCheck,
  onMarkInFridge,
}) => {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line-subtle last:border-b-0">
      {/* 1. 좌측: 체크박스 + 재료명 */}
      <div
        onClick={() => onToggleCheck(item.id)}
        className="flex items-center flex-1 min-w-0 mr-3 cursor-pointer select-none group"
        role="checkbox"
        aria-checked={item.checked}
      >
        <div
          className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
            item.checked
              ? 'bg-ink text-white border border-ink'
              : 'border border-line-strong bg-white group-hover:border-ink-muted'
          }`}
        >
          {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>

        <span
          className={`text-[15px] font-medium ml-3 truncate transition-colors ${
            item.checked ? 'text-ink' : 'text-ink'
          }`}
        >
          {item.name}
        </span>
      </div>

      {/* 2. 우측: [집에 있어요] 버튼 */}
      <button
        type="button"
        onClick={() => onMarkInFridge(item)}
        className="border border-line-strong rounded-[10px] px-3.5 py-1.5 text-[13px] font-medium text-ink hover:bg-fill-subtle active:scale-95 transition-all shrink-0 cursor-pointer select-none"
        title={`${item.name} 집에 있어요`}
      >
        집에 있어요
      </button>
    </div>
  );
};

export default CartUrgentRow;
