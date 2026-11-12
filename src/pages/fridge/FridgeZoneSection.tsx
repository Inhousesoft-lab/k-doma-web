import React from 'react';
import { Plus } from 'lucide-react';
import { Ingredient, IngredientStatus } from '../../types';
import FridgeTile, { AddTile, EmptySlot } from './FridgeTile';
import FridgeListRow from './FridgeListRow';

export interface FridgeZoneSectionProps {
  /** 구역 이름 ('양념 선반', '냉장고') */
  title: string;
  /** 제목 오른쪽 보조 문구 (예: '냉장·냉동 통합') */
  caption?: string;
  /** [추가] 행 문구 (예: '양념 재료 추가') */
  addLabel: string;
  /** 구역이 비었을 때 제목 아래 추가 안내 문구 (KD-46) */
  emptyText: string;
  items: Ingredient[];
  viewMode: 'icon' | 'list';
  /** 상태 필터를 골랐는지 ('전체'가 아닌지) */
  isFiltered: boolean;
  onTileClick: (id: string) => void;
  onStatusChange: (id: string, status: IngredientStatus) => void;
  onRemove: (id: string, name: string) => void;
  onAdd: () => void;
}

const EmptyFiltered = () => (
  <div className="py-4 text-center text-ink-muted text-[13px]">해당하는 재료가 없어요</div>
);

/** 빈 구역 아이콘형: 4칸 × 2행 = [추가] 1칸 + 빈칸 7칸 */
const EMPTY_SLOT_COUNT = 7;

/**
 * 냉장고 화면의 구역 카드 (양념 선반 / 냉장고 공통)
 * - 아이콘형: 한 줄 4개 타일, '전체' 필터일 때만 마지막에 [추가] 타일
 * - 목록형: 행 리스트, '전체' 필터일 때만 아래에 [추가] 행
 * - 필터를 골랐는데 맞는 재료가 없으면 '해당하는 재료가 없어요'
 * - '전체'인데 재료가 0개면 빈 구역 (KD-46, 비로그인·첫 사용 공통)
 *   제목 아래 안내 문구 + 아이콘형은 [추가]와 빈칸 7칸, 목록형은 [+ 재료 추가] 행
 */
export const FridgeZoneSection: React.FC<FridgeZoneSectionProps> = ({
  title,
  caption,
  addLabel,
  emptyText,
  items,
  viewMode,
  isFiltered,
  onTileClick,
  onStatusChange,
  onRemove,
  onAdd,
}) => {
  const showEmpty = isFiltered && items.length === 0;
  const isEmptyZone = !isFiltered && items.length === 0;

  return (
    <section className="bg-white border border-line rounded-card p-3.5 flex flex-col gap-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-bold text-ink">
          {title} <span className="font-normal text-ink-muted text-[16px] ml-0.5">{items.length}</span>
        </h3>
        {caption && <span className="text-[12px] text-ink-muted">{caption}</span>}
      </div>

      {isEmptyZone && <p className="-mt-1 text-[13px] text-ink-muted leading-relaxed">{emptyText}</p>}

      {viewMode === 'icon' ? (
        showEmpty ? (
          <EmptyFiltered />
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {items.map((ingredient) => (
              <FridgeTile key={ingredient.id} ingredient={ingredient} onClick={() => onTileClick(ingredient.id)} />
            ))}
            {!isFiltered && <AddTile onClick={onAdd} />}
            {isEmptyZone && Array.from({ length: EMPTY_SLOT_COUNT }, (_, i) => <EmptySlot key={i} />)}
          </div>
        )
      ) : (
        <div className="flex flex-col">
          {showEmpty ? (
            <EmptyFiltered />
          ) : (
            items.map((ingredient) => (
              <FridgeListRow
                key={ingredient.id}
                ingredient={ingredient}
                onStatusChange={(status) => onStatusChange(ingredient.id, status)}
                onRemove={() => onRemove(ingredient.id, ingredient.name)}
              />
            ))
          )}
          {!isFiltered && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-2 min-h-[46px] w-full border border-dashed border-line-strong rounded-[12px] flex items-center justify-center gap-1.5 text-[14px] font-medium text-ink-muted hover:text-primary hover:border-primary hover:bg-fill-subtle transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default FridgeZoneSection;
