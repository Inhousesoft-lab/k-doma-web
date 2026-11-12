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
  <section className="flex flex-col gap-6">
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

    {/* 2. 테마 요리: '추천 테마: OO' + 새로고침 버튼 + 2열 n행 카드 */}
    {themes.map(({ theme, items }) => (
      <div key={theme}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-[18px] font-bold text-ink">추천 테마: {theme}</h3>
          <button
            type="button"
            onClick={onRefreshTheme}
            aria-label="다른 테마 보기"
            className="w-11 h-11 shrink-0 rounded-[10px] border border-line bg-white flex items-center justify-center text-ink-secondary hover:text-ink active:scale-95 transition cursor-pointer"
          >
            <RotateCw className="w-5 h-5" />
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
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-5">
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
