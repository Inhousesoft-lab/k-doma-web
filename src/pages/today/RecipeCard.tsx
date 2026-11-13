import React from 'react';
import { Heart } from 'lucide-react';
import { Recipe } from '../../types';
import StatusSignal from '../../components/common/StatusSignal';
import NoImage from '../../components/common/NoImage';

// 모니모 스타일 파스텔 배경 순환 배색
const PASTEL_TINTS = [
  'bg-mint-bg text-mint', // Mint
  'bg-peach-bg text-peach', // Peach
  'bg-lavender-bg text-lavender', // Lavender
  'bg-sky-bg text-primary', // Sky
];

export interface RecipeCardProps {
  recipe: Recipe;
  /** 부족한 재료 종류 수. 재료 정보 줄에 쓴다 */
  missingCount: number;
  /** 파스텔 배색 순서 */
  index: number;
  /** false 면 재료 정보 줄을 그리지 않는다 (비로그인, KD-44) */
  showStock: boolean;
  /** true 면 칸 너비에 맞춘다 (테마 2열 그리드, 사진 3:2·글자 작게). 기본은 추천 요리 가로 스크롤용 큰 카드 (KD-67) */
  fullWidth?: boolean;
  /** 추천 이유 한 줄 (추천 요리 첫 카드만). 사진 아래 검은 배지 (KD-67) */
  reason?: string;
  onOpen: (recipeId: string) => void;
  onToggleFavorite: (recipeId: string) => void;
}

/** Today 가로 스크롤 카드 (추천 요리·테마 요리 공통) */
export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  missingCount,
  index,
  showStock,
  fullWidth = false,
  reason,
  onOpen,
  onToggleFavorite,
}) => {
  const tint = PASTEL_TINTS[index % PASTEL_TINTS.length];
  return (
    <div
      onClick={() => onOpen(recipe.id)}
      className={`${fullWidth ? 'w-full min-w-0' : 'w-[260px] shrink-0'} cursor-pointer group select-none flex flex-col`}
    >
      {/* 상단 파스텔 이미지 썸네일 박스 */}
      <div
        className={`w-full ${fullWidth ? 'aspect-[3/2] rounded-[14px]' : 'aspect-[4/3] rounded-[18px]'} ${tint} flex items-center justify-center overflow-hidden transition-transform group-active:scale-[0.98] shadow-2xs`}
      >
        {recipe.photoUrl ? (
          <img
            src={recipe.photoUrl}
            alt={recipe.name}
            className="w-full h-full object-cover pointer-events-none"
            referrerPolicy="no-referrer"
          />
        ) : (
          <NoImage size="md" />
        )}
      </div>

      {/* 아래 요리명 및 메타 */}
      <div className="pt-2.5 flex flex-col">
        {reason && (
          <span className="self-start mb-1.5 px-2 py-[3px] rounded-[6px] bg-ink text-white text-[12px] font-bold">{reason}</span>
        )}
        <h4 className={`${fullWidth ? 'text-[15px]' : 'text-[17px]'} font-bold text-ink leading-snug truncate`}>{recipe.name}</h4>
        <p className="text-[13px] text-ink-muted mt-0.5">
          {[recipe.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes}분` : '', recipe.caloriesKcal ? `${recipe.caloriesKcal} kcal` : '']
            .filter(Boolean)
            .join(' · ')}
        </p>

        {/* 하트 찜 버튼 */}
        <div className="mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe.id);
            }}
            className={`w-9 h-9 rounded-[10px] border border-line bg-white flex items-center justify-center transition-colors cursor-pointer ${
              recipe.isFavorite ? 'text-danger border-danger/30' : 'text-ink-muted hover:text-danger'
            }`}
            aria-label="찜하기"
          >
            <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-danger' : ''}`} />
          </button>
        </div>

        {/* 맨 아래 재료 정보 줄 (KD-51). 비로그인은 그리지 않는다 */}
        {showStock && (
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary mt-2">
            <StatusSignal status={missingCount === 0 ? 'HAVE' : 'NONE'} size={13} />
            <span>{missingCount === 0 ? '재료 모두 있음' : `재료 ${missingCount}개 구매`}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
