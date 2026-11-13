import React from 'react';
import { Trash2 } from 'lucide-react';
import { Ingredient, IngredientStatus } from '../../types';
import IngredientImage from '../../components/common/IngredientImage';

export interface FridgeListRowProps {
  ingredient: Ingredient;
  onStatusChange: (status: IngredientStatus) => void;
  onRemove: () => void;
}

/**
 * 목록형 행 컴포넌트 (5.2 규격)
 * - 행 최소 높이 56px (min-h-[56px])
 * - 좌측: 32x32 이미지, 재료명(15px)
 * - 우측: 3단계 선택 버튼 그룹 [있음] [적음] [없음]
 * - [빼기] 버튼: 누르면 냉장고에서 완전히 제거
 */
export const FridgeListRow: React.FC<FridgeListRowProps> = ({
  ingredient,
  onStatusChange,
  onRemove,
}) => {
  const isNone = ingredient.status === 'NONE';

  const statusButtons: Array<{ key: IngredientStatus; label: string }> = [
    { key: 'HAVE', label: '있음' },
    { key: 'LOW', label: '적음' },
    { key: 'NONE', label: '없음' },
  ];

  const getActiveStyle = (key: IngredientStatus) => {
    switch (key) {
      case 'HAVE':
        return 'bg-have text-white shadow-xs';
      case 'LOW':
        return 'bg-warning text-white shadow-xs';
      case 'NONE':
        return 'bg-ink-muted text-white shadow-xs';
    }
  };

  return (
    <div className="min-h-[56px] py-2.5 px-2 flex items-center justify-between border-b border-line-subtle last:border-b-0 hover:bg-fill-subtle rounded-[10px] transition-colors">
      {/* 1. 좌측: 이미지 (32x32) + 재료명 */}
      <div className="flex items-center gap-2.5 min-w-0 mr-2">
        <IngredientImage
          name={ingredient.name}
          imageKey={ingredient.imageKey}
          className="w-8 h-8 rounded-[8px]"
          placeholder="AI"
          placeholderClassName="text-[9px] font-semibold"
        />
        <span
          className={`text-[15px] font-semibold truncate ${
            isNone ? 'text-ink-muted line-through decoration-1' : 'text-ink'
          }`}
        >
          {ingredient.name}
        </span>
      </div>

      {/* 2. 우측: 3단계 상태 버튼 그룹 + [빼기] */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="inline-flex bg-fill p-0.5 rounded-[10px] gap-0.5" role="group">
          {statusButtons.map((btn) => {
            const isSelected = ingredient.status === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => onStatusChange(btn.key)}
                className={`px-2.5 py-1 text-[12px] font-semibold rounded-[8px] transition-all cursor-pointer ${
                  isSelected
                    ? getActiveStyle(btn.key)
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* [빼기] 버튼 */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger-light rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer"
          title={`${ingredient.name} 냉장고에서 빼기`}
          aria-label={`${ingredient.name} 빼기`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FridgeListRow;
