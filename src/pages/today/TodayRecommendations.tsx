import React from 'react';
import { RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TodayRecipeItem, TodayThemeSection } from '../../services';
import RecipeCard from './RecipeCard';
import HorizontalCardRow from './HorizontalCardRow';

export interface TodayRecommendationsProps {
  /** 추천 요리 (엔진 결과 상위 N개, 점수 순) */
  recommended: TodayRecipeItem[];
  /** 테마 요리 (하루 고정 랜덤) */
  themes: TodayThemeSection[];
  /** 재료 정보 줄 표시 여부. 비로그인은 false (KD-44) */
  showStock: boolean;
  onToggleFavorite: (recipeId: string) => void;
  /** 추천 테마 새로고침: 다른 테마로 바꾼다 */
  onRefreshTheme: () => void;
}

/** 추천 1순위 카드의 추천 이유 (KD-67). 비로그인은 재고를 모르므로 쓰지 않는다 */
const reasonOf = (missingCount: number) => {
  if (missingCount === 0) return '재료 모두 있어요';
  if (missingCount <= 2) return `재료 ${missingCount}개만 사면 돼요`;
  return '오늘의 추천'; // 많이 사야 하면 '~만'이 어색하다
};

/** 카드 가로 줄 하나 (드래그 직후 클릭은 무시) */
const CardRow: React.FC<{
  items: TodayRecipeItem[];
  showStock: boolean;
  onToggleFavorite: (recipeId: string) => void;
}> = ({ items, showStock, onToggleFavorite }) => {
  const navigate = useNavigate();
  return (
    <HorizontalCardRow>
      {(wasDragged) =>
        items.map(({ recipe, missingCount }, index) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            missingCount={missingCount}
            index={index}
            showStock={showStock}
            reason={index === 0 && showStock ? reasonOf(missingCount) : undefined}
            onOpen={(id) => {
              if (wasDragged()) return;
              navigate(`/recipe/${id}`);
            }}
            onToggleFavorite={onToggleFavorite}
          />
        ))
      }
    </HorizontalCardRow>
  );
};

/**
 * Today: 추천 요리 + 테마 요리 (Today 페이지 3·4장, KD-50·51)
 * 냉장고가 비어 있어도 두 섹션을 그대로 보여 준다.
 */
export const TodayRecommendations: React.FC<TodayRecommendationsProps> = ({
  recommended,
  themes,
  showStock,
  onToggleFavorite,
  onRefreshTheme,
}) => (
  <section className="flex flex-col flex-1 gap-6">
    {/* 1. 추천 요리: '오늘 한끼 뭐먹지?' */}
    <div>
      <h2 className="text-[22px] font-black text-ink tracking-tight mb-3">오늘 한끼 뭐먹지?</h2>
      {recommended.length > 0 ? (
        <CardRow items={recommended} showStock={showStock} onToggleFavorite={onToggleFavorite} />
      ) : (
        <div className="p-4 bg-fill-subtle rounded-[16px] text-center text-[13px] text-ink-muted">
          추천할 요리가 없어요.
        </div>
      )}
    </div>

    {/* 2. 테마 요리: 옅은 배경 안 보조 영역 (KD-67). '추천 테마: OO' + 새로고침 + 2열 n행 카드 */}
    {themes.map(({ theme, items }) => (
      <div key={theme} className="-mx-5 px-5 pt-3.5 pb-[108px] bg-fill rounded-t-[20px] grow">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="text-[16px] font-bold text-ink-secondary">추천 테마: {theme}</h3>
          <button
            type="button"
            onClick={onRefreshTheme}
            aria-label="다른 테마 보기"
            className="w-11 h-11 -mr-2.5 shrink-0 rounded-[10px] flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-white/70 active:scale-95 transition cursor-pointer"
          >
            <RotateCw className="w-[18px] h-[18px]" />
          </button>
        </div>
        <CardGrid items={items} showStock={showStock} onToggleFavorite={onToggleFavorite} />
      </div>
    ))}
  </section>
);

/** 카드 2열 그리드 (테마 요리) */
const CardGrid: React.FC<{
  items: TodayRecipeItem[];
  showStock: boolean;
  onToggleFavorite: (recipeId: string) => void;
}> = ({ items, showStock, onToggleFavorite }) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
      {items.map(({ recipe, missingCount }, index) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          missingCount={missingCount}
          index={index}
          showStock={showStock}
          fullWidth
          onOpen={(id) => navigate(`/recipe/${id}`)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default TodayRecommendations;
