import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, LayoutList, LayoutGrid, Search } from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import {
  recipeService,
  ingredientService,
  authService,
  subscribeToDataChanges,
} from '../services';
import StateView from '../components/common/StateView';
import NoImage from '../components/common/NoImage';
import useLoginGate from '../hooks/useLoginGate';

const MAIN_INGREDIENTS = [
  '전체',
  '닭',
  '돼지',
  '소',
  '해산물·생선',
  '계란',
  '두부',
  '채소',
];

const CATEGORIES = [
  '전체',
  '밥',
  '면·파스타',
  '국·탕·찌개',
  '분식',
  '반찬',
  '특식',
  '간식',
];

export const RecipesPage: React.FC = () => {
  const navigate = useNavigate();

  // 보기 모드: 목록형 vs 피드형
  const [viewMode, setViewMode] = useState<'list' | 'feed'>('list');

  // 검색 및 필터 상태 (두 필터는 서로 독립적으로 동작)
  const [search, setSearch] = useState<string>('');
  const [selectedMain, setSelectedMain] = useState<string>('전체');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 데이터 상태
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  // 비로그인이면 요리별 보유 상태(바로 가능·부족 n개)를 보여 주지 않는다 (KD-44). 로그인 상태가 바뀌면 데이터 변경 알림으로 다시 그린다
  const isLoggedIn = authService.isLoggedIn();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const { requireLogin, loginModal } = useLoginGate();

  const loadData = useCallback(async () => {
    try {
      const [allRecipes, allIngredients] = await Promise.all([
        recipeService.getRecipes(),
        ingredientService.getIngredients(),
      ]);
      setRecipes(allRecipes);
      setIngredients(allIngredients);
      setError(false);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // 찜 토글
  const handleToggleFavorite = async (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    // 비로그인: 로그인 유도 모달 → 로그인하면 찜을 켠다 (KD-27 찜은 계정별)
    try {
      await requireLogin(() => recipeService.toggleFavorite(recipeId).then(() => undefined), {
        afterLogin: () => recipeService.addFavorite(recipeId),
        description: '찜하려면 로그인해 주세요.',
      });
    } catch (err) {
      console.error('찜을 저장하지 못했어요', err);
    }
  };

  // 필터링 및 검색 계산 (전환해도 검색·필터 유지)
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // 1. 주재료 필터
      if (selectedMain !== '전체') {
        const matchesMain =
          r.mainIngredient === selectedMain ||
          r.tags?.includes(selectedMain) ||
          r.name.includes(selectedMain);
        if (!matchesMain) return false;
      }

      // 2. 요리 종류 필터 (주재료와 따로 독립적으로 동작)
      if (selectedCategory !== '전체') {
        const matchesCategory =
          r.category === selectedCategory ||
          r.tags?.includes(selectedCategory);
        if (!matchesCategory) return false;
      }

      // 3. 검색어 필터 (요리명, 재료명)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesIngredient = r.ingredientsRequired?.some((ing) =>
          ing.name.toLowerCase().includes(q)
        );
        const matchesTag = r.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesIngredient && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [recipes, selectedMain, selectedCategory, search]);

  // 결과 문구 생성 (예: '돼지 · 전체 종류 9개', 와이어프레임 완벽 일치)
  const resultCountText = useMemo(() => {
    const mainLabel = selectedMain;
    const catLabel = selectedCategory === '전체' ? '전체 종류' : selectedCategory;
    return `${mainLabel} · ${catLabel} ${filteredRecipes.length}개`;
  }, [selectedMain, selectedCategory, filteredRecipes.length]);

  if (loading) {
    return <StateView type="loading" />;
  }

  if (error) {
    return (
      <StateView
        type="error"
        title="요리 목록을 불러오지 못했어요"
        description="네트워크 연결을 확인하고 다시 시도해주세요."
        actionText="다시 시도"
        onAction={loadData}
      />
    );
  }

  return (
    <div className="flex flex-col px-5 pt-3 pb-8 gap-4 bg-white min-h-screen">
      {/* 1. 상단 제목 줄: '요리 79' + 찜 아이콘(♡) + 보기 전환 (와이어프레임 완벽 일치) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-black text-ink tracking-tight">
            요리 <span className="font-bold text-ink-muted">{recipes.length}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* 찜 아이콘 버튼 (찜 화면 /recipes/likes 로 이동) */}
          <button
            type="button"
            onClick={() =>
              requireLogin(() => navigate('/recipes/likes'), { description: '찜한 요리를 보려면 로그인해 주세요.' })
            }
            className="w-[38px] h-[38px] rounded-[12px] border border-line-strong bg-white flex items-center justify-center text-ink hover:text-danger hover:border-danger transition-colors cursor-pointer"
            aria-label="찜한 요리 보기"
          >
            <Heart className="w-[18px] h-[18px]" />
          </button>

          {/* 보기 모드 전환: 목록형 / 피드형 토글 */}
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
              onClick={() => setViewMode('feed')}
              className={`w-[32px] h-[30px] rounded-[9px] flex items-center justify-center transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
              title="피드형 보기"
              aria-label="피드형 보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 검색창 (와이어프레임: 돋보기 아이콘 + '요리명, 재료로 검색') */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="요리명, 재료로 검색"
          className="w-full h-[46px] pl-10 pr-4 rounded-btn bg-fill text-[15px] text-ink placeholder-ink-muted outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border focus:border-primary transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink cursor-pointer"
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {/* 3. 필터 2줄: 주재료 / 요리 종류 (와이어프레임 완벽 일치) */}
      <div className="flex flex-col gap-2.5">
        {/* 필터 1줄: 주재료 (전체·닭·돼지·소·해산물·생선·계란·두부·채소) */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink shrink-0 min-w-[50px]">
            주재료
          </span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {MAIN_INGREDIENTS.map((main) => {
              const isSelected = selectedMain === main;
              return (
                <button
                  key={main}
                  type="button"
                  onClick={() => setSelectedMain(main)}
                  className={`h-[34px] px-3.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-white font-bold'
                      : 'bg-white border border-line-strong text-ink hover:border-ink'
                  }`}
                >
                  {main}
                </button>
              );
            })}
          </div>
        </div>

        {/* 필터 2줄: 요리 종류 (전체·밥·면·파스타·국·탕·찌개·분식·반찬·특식·간식) */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink shrink-0 min-w-[50px]">
            요리 종류
          </span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-[34px] px-3.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-white font-bold'
                      : 'bg-white border border-line-strong text-ink hover:border-ink'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 결과 수 표시 줄 (정렬 선택 UI는 두지 않음!) */}
      <div className="pt-1">
        <span className="text-[14px] font-bold text-ink">
          {resultCountText}
        </span>
      </div>

      {/* 5. 요리 목록 (목록형 / 피드형) */}
      {filteredRecipes.length === 0 ? (
        <div className="py-12 text-center text-ink-muted text-[14px]">
          조건에 맞는 요리가 없습니다.
        </div>
      ) : viewMode === 'list' ? (
        /* 2.3 목록형: 행마다 썸네일, 요리명, 주재료·종류·시간, 바로가능/부족n개·kcal, 찜 버튼 */
        <div className="flex flex-col divide-y divide-line-subtle">
          {filteredRecipes.map((recipe) => {
            const { statusLabel } = recipeService.calculateMissing(recipe, ingredients);
            const isFav = recipeService.isFavorite(recipe.id);
            // 비로그인: '바로 가능'·'부족 n개'를 표시하지 않고 kcal 만 (없으면 줄 생략, KD-44)
            const statusLine = isLoggedIn
              ? `${statusLabel}${recipe.caloriesKcal ? ` · ${recipe.caloriesKcal} kcal` : ''}`
              : recipe.caloriesKcal
                ? `${recipe.caloriesKcal} kcal`
                : '';

            return (
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
                    {recipe.mainIngredient} · {recipe.category}{recipe.cookTimeMinutes > 0 ? ` · ${recipe.cookTimeMinutes}분` : ''}
                  </p>
                  {statusLine && (
                    <p className="text-[13px] font-medium text-ink-secondary mt-0.5">{statusLine}</p>
                  )}
                </div>

                {/* 우측 찜 버튼 (♡) */}
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(e, recipe.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isFav
                      ? 'text-danger'
                      : 'text-ink-muted hover:text-danger'
                  }`}
                  aria-label="찜하기"
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-danger' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2.4 피드형: 카드마다 큰 사진, 찜 버튼, 보유 상태, 요리명, 태그, 영양성분 4칸 */
        <div className="flex flex-col gap-6">
          {filteredRecipes.map((recipe) => {
            const { feedStatusLabel } = recipeService.calculateMissing(recipe, ingredients);
            const isFav = recipeService.isFavorite(recipe.id);

            return (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="bg-white rounded-card p-4.5 border border-line flex flex-col gap-3 cursor-pointer group active:scale-[0.99] transition-all"
              >
                {/* 상단 큰 사진 박스 */}
                <div className="w-full aspect-[4/3] rounded-[18px] bg-line-subtle flex flex-col items-center justify-center text-ink-muted overflow-hidden">
                  {recipe.photoUrl ? (
                    <img
                      src={recipe.photoUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <NoImage size="lg" />
                  )}
                </div>

                {/* 찜 버튼 + 보유 상태 줄 */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, recipe.id)}
                    className={`w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${
                      isFav
                        ? 'text-danger'
                        : 'text-ink-muted hover:text-danger'
                    }`}
                    aria-label="찜하기"
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-danger' : ''}`} />
                  </button>
                  {/* 비로그인: 상태 문구를 그리지 않는다 (KD-44) */}
                  {isLoggedIn && (
                    <span className="text-[13px] font-medium text-ink-secondary">{feedStatusLabel}</span>
                  )}
                </div>

                {/* 요리명 및 태그 */}
                <div>
                  <h3 className="text-[20px] font-black text-ink group-hover:text-primary transition-colors leading-tight">
                    {recipe.name}
                  </h3>
                  <p className="text-[13px] text-ink-muted mt-1">
                    {recipe.mainIngredient} · {recipe.category}{recipe.cookTimeMinutes > 0 ? ` · ${recipe.cookTimeMinutes}분` : ''} ·{' '}
                    {recipe.servings || 2}인분
                  </p>
                </div>

                {/* 영양성분 4칸: 칼로리·탄수화물·단백질·지방 (영양 데이터 없는 요리는 통째로 미표시) */}
                {recipe.nutrition && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="bg-fill rounded-[12px] py-2 px-1 text-center">
                      <span className="block text-[11px] text-ink-muted font-medium">
                        칼로리
                      </span>
                      <span className="block text-[13px] font-bold text-ink mt-0.5">
                        {recipe.nutrition.calories}kcal
                      </span>
                    </div>
                    <div className="bg-fill rounded-[12px] py-2 px-1 text-center">
                      <span className="block text-[11px] text-ink-muted font-medium">
                        탄수화물
                      </span>
                      <span className="block text-[13px] font-bold text-ink mt-0.5">
                        {recipe.nutrition.carbs}g
                      </span>
                    </div>
                    <div className="bg-fill rounded-[12px] py-2 px-1 text-center">
                      <span className="block text-[11px] text-ink-muted font-medium">
                        단백질
                      </span>
                      <span className="block text-[13px] font-bold text-ink mt-0.5">
                        {recipe.nutrition.protein}g
                      </span>
                    </div>
                    <div className="bg-fill rounded-[12px] py-2 px-1 text-center">
                      <span className="block text-[11px] text-ink-muted font-medium">
                        지방
                      </span>
                      <span className="block text-[13px] font-bold text-ink mt-0.5">
                        {recipe.nutrition.fat}g
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 비로그인 찜 → 로그인 유도 모달 */}
      {loginModal}
    </div>
  );
};

export default RecipesPage;
