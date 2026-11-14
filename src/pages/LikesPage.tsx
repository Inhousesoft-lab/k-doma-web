import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, LayoutList, LayoutGrid } from 'lucide-react';
import { recipeService } from '../services';
import StateView from '../components/common/StateView';
import Button from '../components/common/Button';
import NoImage from '../components/common/NoImage';
import useServiceData from '../hooks/useServiceData';

export const LikesPage: React.FC = () => {
  const navigate = useNavigate();

  // 보기 모드: 목록형 vs 사진형
  const [viewMode, setViewMode] = useState<'list' | 'photo'>('list');

  // 내 찜 목록 (Firestore users/{uid}/favorites, 최근 찜한 순)
  const { data, loading, error: loadFailed, retry } = useServiceData(() => recipeService.getFavoriteRecipes());
  const favorites = data ?? [];

  // 찜 해제 (꽉 찬 하트 클릭 시 해제). 목록은 구독(subscribeToDataChanges)이 다시 불러온다
  const handleRemoveFavorite = async (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    try {
      await recipeService.toggleFavorite(recipeId);
    } catch (err) {
      console.error('찜을 해제하지 못했어요', err);
    }
  };

  if (loading) {
    return <StateView type="loading" />;
  }

  if (loadFailed) {
    return (
      <StateView
        type="error"
        title="찜 목록을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        actionText="다시 시도"
        onAction={retry}
      />
    );
  }

  return (
    <div className="flex flex-col px-5 pt-3 pb-8 gap-4 bg-white min-h-screen">
      {/* 1. 상단 정보 줄: 찜한 요리 개수 + 목록형 / 사진형 보기 전환 */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-ink">
          찜한 요리 <span className="text-primary">{favorites.length}</span>개
        </span>

        <div className="flex items-center bg-fill p-1 rounded-[12px]">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`w-[32px] h-[30px] rounded-[9px] flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
            title="목록형 보기"
            aria-label="목록형 보기"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('photo')}
            className={`w-[32px] h-[30px] rounded-[9px] flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'photo'
                ? 'bg-white text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
            title="사진형 보기"
            aria-label="사진형 보기"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 찜 목록 표시 (필터·검색 없이 찜한 요리 전체 표시) */}
      {favorites.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-danger-light flex items-center justify-center text-danger mb-3">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-[17px] font-bold text-ink mb-1">
            찜한 요리가 없어요
          </h3>
          <p className="text-[13px] text-ink-muted mb-5">
            마음에 드는 요리를 찜해두고 언제든 꺼내보세요.
          </p>
          <div className="w-[180px]">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/recipes')}
            >
              요리 둘러보기
            </Button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* 목록형: 행마다 사진, 요리명, 종류·시간, kcal, 꽉 찬 ♡ */
        <div className="flex flex-col divide-y divide-line-subtle">
          {favorites.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              className="py-3.5 flex items-center justify-between gap-3 cursor-pointer group active:opacity-90"
            >
              {/* 왼쪽 사각 썸네일 */}
              <div className="w-[64px] h-[64px] rounded-btn bg-thumb flex items-center justify-center shrink-0 overflow-hidden text-ink-muted">
                {recipe.photoUrl ? (
                  <img
                    src={recipe.photoUrl}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <NoImage size="sm" />
                )}
              </div>

              {/* 중간 요리 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-ink truncate leading-tight group-hover:text-primary transition-colors">
                  {recipe.name}
                </h3>
                <p className="text-[13px] text-ink-muted mt-1">
                  {recipe.category}{recipe.cookTimeMinutes > 0 ? ` · ${recipe.cookTimeMinutes}분` : ''}
                </p>
                {recipe.caloriesKcal && (
                  <p className="text-[13px] font-medium text-ink-secondary mt-0.5">
                    {recipe.caloriesKcal} kcal
                  </p>
                )}
              </div>

              {/* 우측 꽉 찬 찜 버튼 (클릭 시 찜 해제) */}
              <button
                type="button"
                onClick={(e) => handleRemoveFavorite(e, recipe.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-danger hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="찜 해제"
              >
                <Heart className="w-5 h-5 fill-danger" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* 사진형: 2열 그리드, 사진 위 꽉 찬 ♡ */
        <div className="grid grid-cols-2 gap-3.5">
          {favorites.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              className="flex flex-col cursor-pointer group active:scale-[0.98] transition-all"
            >
              {/* 상단 사각 사진 박스 (상단 우측에 꽉 찬 하트 플로팅) */}
              <div className="relative aspect-square w-full rounded-[18px] bg-line-subtle flex items-center justify-center overflow-hidden">
                {recipe.photoUrl ? (
                  <img
                    src={recipe.photoUrl}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <NoImage size="md" />
                )}

                {/* 사진 위 플로팅 꽉 찬 하트 버튼 */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveFavorite(e, recipe.id)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-danger shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  aria-label="찜 해제"
                >
                  <Heart className="w-4 h-4 fill-danger" />
                </button>
              </div>

              {/* 하단 요리명 및 메타 */}
              <div className="pt-2 flex flex-col">
                <h4 className="text-[15px] font-bold text-ink truncate leading-tight group-hover:text-primary transition-colors">
                  {recipe.name}
                </h4>
                <p className="text-[12px] text-ink-muted mt-0.5">
                  {recipe.category}{recipe.cookTimeMinutes > 0 ? ` · ${recipe.cookTimeMinutes}분` : ''}
                  {recipe.caloriesKcal ? ` · ${recipe.caloriesKcal} kcal` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikesPage;
