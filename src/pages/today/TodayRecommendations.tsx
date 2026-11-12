import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Refrigerator } from 'lucide-react';
import { Recipe } from '../../types';
import StatusSignal from '../../components/common/StatusSignal';
import Button from '../../components/common/Button';
import NoImage from '../../components/common/NoImage';

export interface TodayRecommendationsProps {
  readyRecipes: Array<{ recipe: Recipe; missingCount: 0 }>;
  needBuyRecipes: Array<{ recipe: Recipe; missingCount: number; missingIngredientNames: string[] }>;
  isFridgeEmpty: boolean;
  onToggleFavorite: (recipeId: string) => void;
}

// 모니모 스타일 파스텔 배경 순환 배색
const PASTEL_TINTS = [
  'bg-mint-bg text-mint', // Mint
  'bg-peach-bg text-peach', // Peach
  'bg-lavender-bg text-lavender', // Lavender
  'bg-sky-bg text-primary', // Sky
];

export const TodayRecommendations: React.FC<TodayRecommendationsProps> = ({
  readyRecipes,
  needBuyRecipes,
  isFridgeEmpty,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();

  // 좌우 드래그 스크롤 제어
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [startX, setStartX] = React.useState<number>(0);
  const [scrollLeft, setScrollLeft] = React.useState<number>(0);
  const hasDraggedRef = React.useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // 냉장고가 비어 있을 때의 안내 및 등록 화면 (기획서 6장)
  if (isFridgeEmpty) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-[22px] font-black text-ink tracking-tight">
          오늘 한끼 뭐먹지?
        </h2>
        <div className="bg-white rounded-card p-6 text-center border border-line-subtle shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary mb-3">
            <Refrigerator className="w-7 h-7" />
          </div>
          <h3 className="text-[17px] font-bold text-ink mb-1">
            냉장고가 비어 있어요
          </h3>
          <p className="text-[13px] text-ink-muted mb-5 max-w-[260px] leading-relaxed">
            냉장고에 보관 중인 재료를 등록하면 지금 바로 만들 수 있는 요리를 추천해 드려요.
          </p>
          <div className="w-full max-w-[220px]">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/fridge')}
            >
              냉장고에 재료 등록
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {/* 1. 섹션 헤더: '오늘 한끼 뭐먹지?' */}
      <div>
        <h2 className="text-[22px] font-black text-ink tracking-tight">
          오늘 한끼 뭐먹지?
        </h2>
      </div>

      {/* 2. 그룹 1: '지금 바로 만들 수 있어요' (가로 스크롤 카드 영역) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[18px] font-bold text-ink">
            지금 바로 만들 수 있어요
          </h3>
          <span className="text-[16px] font-bold text-ink-muted">
            {readyRecipes.length}
          </span>
        </div>

        {readyRecipes.length > 0 ? (
          /* 좌우 스크롤 컨테이너: -mx-5 px-5 로 화면 가장자리까지 시원하게 스크롤 + 마우스 드래그/터치 완벽 지원 */
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5 -mx-5 px-5 scroll-smooth touch-pan-x select-none cursor-grab active:cursor-grabbing"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {readyRecipes.map(({ recipe }, index) => {
              const tint = PASTEL_TINTS[index % PASTEL_TINTS.length];
              return (
                <div
                  key={recipe.id}
                  onClick={() => {
                    if (hasDraggedRef.current) return;
                    navigate(`/recipe/${recipe.id}`);
                  }}
                  className="w-[180px] shrink-0 cursor-pointer group select-none flex flex-col"
                >
                  {/* 상단 파스텔 이미지 썸네일 박스 */}
                  <div
                    className={`w-full aspect-[4/3] rounded-[18px] ${tint} flex items-center justify-center overflow-hidden transition-transform group-active:scale-[0.98] shadow-2xs`}
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
                    <h4 className="text-[16px] font-bold text-ink leading-snug truncate">
                      {recipe.name}
                    </h4>
                    <p className="text-[13px] text-ink-muted mt-0.5">
                      {recipe.cookTimeMinutes}분
                      {recipe.caloriesKcal ? ` · ${recipe.caloriesKcal} kcal` : ''}
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
                        <Heart
                          className={`w-4 h-4 ${recipe.isFavorite ? 'fill-danger' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 끝 여백 보정용 더미 */}
            <div className="w-1 shrink-0" aria-hidden="true" />
          </div>
        ) : (
          <div className="p-4 bg-fill-subtle rounded-[16px] text-center text-[13px] text-ink-muted">
            지금 바로 만들 수 있는 요리가 없어요.
          </div>
        )}
      </div>

      {/* 3. 그룹 2: '1~2개만 사면 돼요 7' (세로 목록 + 우측 전체 보기) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-bold text-ink">
              1~2개만 사면 돼요
            </h3>
            <span className="text-[16px] font-bold text-ink-muted">
              {needBuyRecipes.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/recipes')}
            className="text-[13px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
          >
            전체 보기
          </button>
        </div>

        {needBuyRecipes.length > 0 ? (
          <div className="flex flex-col gap-3">
            {needBuyRecipes.map(({ recipe, missingIngredientNames }) => (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="flex items-center justify-between gap-3 py-1 cursor-pointer group active:opacity-90"
              >
                {/* 좌측 사각 썸네일 */}
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

                {/* 중간 정보: 요리명, 조리시간·kcal, ◌ 없음: 재료명 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] font-bold text-ink truncate">
                    {recipe.name}
                  </h4>
                  <p className="text-[13px] text-ink-muted mt-0.5">
                    {recipe.cookTimeMinutes}분
                    {recipe.caloriesKcal ? ` · ${recipe.caloriesKcal} kcal` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary mt-1">
                    <StatusSignal status="NONE" size={13} />
                    <span>없음: {missingIngredientNames.join(', ')}</span>
                  </div>
                </div>

                {/* 우측 찜 버튼 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(recipe.id);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    recipe.isFavorite
                      ? 'text-danger'
                      : 'text-ink-muted hover:text-danger'
                  }`}
                  aria-label="찜하기"
                >
                  <Heart
                    className={`w-5 h-5 ${recipe.isFavorite ? 'fill-danger' : ''}`}
                  />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-fill-subtle rounded-[16px] text-center text-[13px] text-ink-muted">
            1~2개 구매 추천 요리가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
};

export default TodayRecommendations;
