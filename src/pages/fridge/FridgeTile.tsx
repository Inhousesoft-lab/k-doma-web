import React from 'react';
import { Plus } from 'lucide-react';
import { Ingredient } from '../../types';
import StatusSignal from '../../components/common/StatusSignal';
import IngredientImage from '../../components/common/IngredientImage';

export interface FridgeTileProps {
  ingredient: Ingredient;
  onClick: () => void;
  /** 끌어서 구역 옮기기 시작 (useZoneDrag) */
  onPointerDown?: (e: React.PointerEvent) => void;
  /** 지금 끌고 있는 타일이면 흐리게 */
  isDragging?: boolean;
}

/**
 * 아이콘형 타일 (5.1 규격)
 * - 한 줄에 4개 고정 (grid-cols-4)
 * - 높이: 88px (h-[88px])
 * - 타일 내부: 48x48 이미지 → 4px → 상태 모양(12px) + 재료명(12px). 상태 모양은 재료명 왼쪽 (KD-42)
 * - 상태별 서피스:
 *   - 있음/적음: border border-line bg-fill-subtle rounded-[16px]
 *   - 없음: border border-dashed border-line-strong bg-white opacity-70 rounded-[16px]
 * - 탭 시: 있음 → 적음 → 없음 → 있음 즉시 전환
 */
export const FridgeTile: React.FC<FridgeTileProps> = ({ ingredient, onClick, onPointerDown, isDragging = false }) => {
  const isNone = ingredient.status === 'NONE';

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: 'none' }}
      className={`relative h-[88px] w-full flex flex-col items-center justify-between p-1.5 transition-all duration-150 cursor-pointer active:scale-95 select-none text-left ${
        isNone
          ? 'border border-dashed border-line-strong bg-white opacity-70 rounded-[16px] hover:opacity-90'
          : 'border border-line bg-fill-subtle rounded-[16px] hover:bg-fill-hover shadow-2xs'
      } ${isDragging ? '!opacity-30' : ''}`}
      aria-label={`${ingredient.name} 상태 변경`}
    >
      {/* 1. 중앙 이미지 영역 (48x48px). 이미지 위에는 아무것도 얹지 않는다 (KD-42) */}
      <IngredientImage
        name={ingredient.name}
        imageKey={ingredient.imageKey}
        className="w-12 h-12 mt-0.5 rounded-[10px] pointer-events-none"
      />

      {/* 2. 하단: 상태 모양(12px) + 4px + 재료명(12px) (기획 5.1) */}
      <div className="w-full flex items-center justify-center gap-1 px-0.5 mb-0.5 min-w-0 pointer-events-none">
        <StatusSignal status={ingredient.status} size={12} className="shrink-0" />
        <span
          className={`text-[12px] font-medium truncate leading-tight ${
            isNone ? 'text-ink-muted' : 'text-ink'
          }`}
        >
          {ingredient.name}
        </span>
      </div>
    </button>
  );
};

export interface AddTileProps {
  onClick: () => void;
  label?: string;
}

/**
 * 구역 마지막 [추가] 타일
 * - 점선 테두리, '+' 아이콘, '추가' 라벨
 * - 높이: 88px (h-[88px])
 */
export const AddTile: React.FC<AddTileProps> = ({ onClick, label = '추가' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[88px] w-full border border-dashed border-line-strong bg-white rounded-[16px] flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-primary hover:text-primary hover:bg-fill-subtle active:scale-95 transition-all cursor-pointer select-none"
      aria-label={`${label} 버튼`}
    >
      <Plus className="w-5 h-5 stroke-[2.2]" />
      <span className="text-[12px] font-medium">{label}</span>
    </button>
  );
};

/**
 * 빈 구역의 빈칸 (KD-46)
 * - 일반 타일과 같은 크기(88px), 옅은 점선 테두리, 아주 옅은 배경, 내용 없음
 * - 장식용이라 스크린리더에서 숨기고 클릭 반응이 없다
 */
export const EmptySlot: React.FC = () => (
  <div aria-hidden="true" className="h-[88px] w-full border border-dashed border-line bg-fill-subtle rounded-[16px]" />
);

export default FridgeTile;
