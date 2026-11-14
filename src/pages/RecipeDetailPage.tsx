import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, CalendarPlus } from 'lucide-react';
import { todayStr } from '../utils/date';
import { getMissingIngredientNames } from '../utils/ingredient';
import {
  recipeService,
  ingredientService,
  cartService,
  mealPlanService,
  authService,
  DuplicatePlanError,
  PlanLimitError,
} from '../services';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import useLoginGate from '../hooks/useLoginGate';
import useServiceData from '../hooks/useServiceData';
import { scaleAmount } from '../utils/amount';
import StateView from '../components/common/StateView';
import NoImage from '../components/common/NoImage';
import NutritionSection from './recipe/NutritionSection';
import IngredientsSection from './recipe/IngredientsSection';
import StepsSection from './recipe/StepsSection';

export const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();

  // 인분 조절 상태 (기본 레시피 인분 수 or 2인분)
  const [servings, setServings] = useState<number>(2);

  // 피드백 토스트 상태
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  // [오늘 기록에 추가] 저장 중 (연속 누름 방지)
  const [addingPlan, setAddingPlan] = useState<boolean>(false);

  // 로그인이 필요한 동작(찜·장바구니·오늘 기록)은 비로그인이면 로그인 유도 모달 (기획서 5장)
  const { requireLogin, loginModal } = useLoginGate();

  // 인분은 요리를 처음 열 때만 기본값으로 맞춘다 (데이터가 바뀌어 다시 읽어도 사용자가 고른 인분 유지)
  const servingsInitializedFor = useRef<string | null>(null);

  const isLoggedIn = authService.isLoggedIn();

  // 데이터 상태. 없는 요리 id 면 오류 화면
  const { data, loading, error } = useServiceData(async () => {
    if (!recipeId) throw new Error('요리 id 가 없어요');
    const [r, ingredients] = await Promise.all([
      recipeService.getRecipeById(recipeId),
      ingredientService.getIngredients(),
    ]);
    if (!r) throw new Error(`요리를 찾을 수 없어요: ${recipeId}`);
    return { recipe: r, fridgeIngredients: ingredients };
  }, [recipeId]);
  const recipe = data?.recipe;

  // 반영된 요리 기준으로 인분을 맞춘다 (fetcher 안에서 하면 늦게 끝난 옛 요청이 인분을 바꿀 수 있다)
  useEffect(() => {
    if (!recipe || servingsInitializedFor.current === recipe.id) return;
    servingsInitializedFor.current = recipe.id;
    setServings(recipe.servings || 2);
  }, [recipe]);
  const fridgeIngredients = useMemo(() => data?.fridgeIngredients ?? [], [data]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // 1. 찜 토글 (계정별 저장). 비로그인이면 로그인 후 찜을 켠다
  const handleToggleFavorite = async () => {
    if (!recipe) return;
    const id = recipe.id;
    try {
      await requireLogin(() => recipeService.toggleFavorite(id).then(() => undefined), {
        afterLogin: () => recipeService.addFavorite(id),
        description: '찜하려면 로그인해 주세요.',
      });
    } catch (e) {
      console.error(e);
      showToastMessage('찜을 저장하지 못했어요. 다시 시도해 주세요');
    }
  };

  // 2. 공유 링크 복사 (기획서 4.1: www.kdoma.com/recipe/{recipeId} 형식)
  const handleShare = async () => {
    if (!recipe) return;
    const shareUrl = `www.kdoma.com/recipe/${recipe.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage('공유 링크가 복사되었습니다');
    } catch {
      setToastMessage(`공유 링크: ${shareUrl}`);
    }
    setShowToast(true);
  };

  // 재료 복사: 지금 고른 인분 기준으로 "재료명 양, 재료명 양, ..." 한 줄로 복사
  const handleCopyIngredients = async () => {
    if (!recipe) return;
    const text = (recipe.ingredientsRequired ?? [])
      .map((item) => {
        const qty = scaleAmount(item.amount, servings, recipe.servings || 2);
        return qty === '-' ? item.name : `${item.name} ${qty}`; // 양 없는 재료(식용유 등)는 이름만
      })
      .join(', ');
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('재료가 복사되었습니다');
    } catch {
      showToastMessage('재료를 복사하지 못했어요. 다시 시도해 주세요');
    }
  };

  // 3. 인분 수 변경 (−/+)
  const handleServingsChange = (delta: number) => {
    setServings((prev) => Math.max(1, Math.min(8, prev + delta)));
  };

  // 로그인 직후: 고른 재료를 장바구니에 '담기' (토글이 아니라 추가 → 이미 담긴 재료를 빼지 않음)
  const CART_SAVE_FAILED = '장바구니에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

  const addToCartAfterLogin = (names: string[]) => async () => {
    try {
      await cartService.addItems(names, true);
    } catch (e) {
      console.error(e);
      showToastMessage(CART_SAVE_FAILED);
      return;
    }
    showToastMessage(
      names.length === 1 ? `'${names[0]}' 재료를 장바구니에 담았어요` : `재료 ${names.length}개를 장바구니에 담았어요`
    );
  };

  // 4. 재료 장바구니 토글 (단건)
  const handleToggleCartItem = async (ingredientName: string) => {
    const toggle = async () => {
      try {
        await cartService.toggleItem(ingredientName, true);
      } catch (e) {
        console.error(e);
        showToastMessage(CART_SAVE_FAILED);
      }
    };
    await requireLogin(toggle, {
      afterLogin: addToCartAfterLogin([ingredientName]),
      description: '장바구니에 담으려면 로그인해 주세요.',
    });
  };

  // 5. 없는 재료 모두 장바구니에 추가 (일괄)
  const handleAddAllMissingToCart = async (missingNames: string[]) => {
    if (missingNames.length === 0) return;
    await requireLogin(
      async () => {
        try {
          await cartService.addItems(missingNames, true);
        } catch (e) {
          console.error(e);
          showToastMessage(CART_SAVE_FAILED);
          return;
        }
        showToastMessage(`없는 재료 ${missingNames.length}개를 장바구니에 담았어요`);
      },
      {
        afterLogin: addToCartAfterLogin(missingNames),
        description: '장바구니에 담으려면 로그인해 주세요.',
      }
    );
  };

  // 6. [오늘 기록에 추가] (기획서 4.3: 화면 이동 없음, 토스트)
  //    덮어쓰지 않고 추가한다. 하루 10개·같은 요리 중복은 막는다 (KD-57, KD-61)
  //    비로그인이면 로그인 후 이어서 추가한다 (기록은 가구 단위)
  const handleAddToTodayPlan = async () => {
    if (!recipe || addingPlan) return;
    const id = recipe.id;
    await requireLogin(
      async () => {
        setAddingPlan(true);
        try {
          await mealPlanService.addPlan(todayStr(), id);
          showToastMessage('오늘 기록에 추가했어요');
        } catch (e) {
          if (e instanceof DuplicatePlanError || e instanceof PlanLimitError) {
            showToastMessage(e.message);
          } else {
            console.error(e);
            showToastMessage('기록에 추가하지 못했어요. 다시 시도해 주세요');
          }
        } finally {
          setAddingPlan(false);
        }
      },
      { description: '오늘 기록에 추가하려면 로그인해 주세요.' }
    );
  };

  // 없는 재료 목록 계산 (재료 사전 기준 매칭, 03-2)
  const missingIngredientNames = useMemo(
    () => (recipe ? getMissingIngredientNames(recipe, fridgeIngredients) : []),
    [recipe, fridgeIngredients]
  );

  if (loading) {
    return <StateView type="loading" />;
  }

  if (error || !recipe) {
    return (
      <StateView
        type="error"
        title="요리 정보를 찾을 수 없어요"
        actionText="요리 목록으로"
        onAction={() => navigate('/recipes')}
      />
    );
  }

  const isFav = recipeService.isFavorite(recipe.id);

  return (
    <div className="flex flex-col bg-white min-h-screen pb-28">
      <div className="px-5 pt-4 flex flex-col gap-6">
        {/* 1. 요리 대표 사진 (전체 폭 라운드 카드) */}
        <div className="w-full aspect-[4/3] rounded-sheet bg-line-subtle overflow-hidden flex items-center justify-center text-ink-muted shadow-2xs relative">
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

        {/* 2. 요리명과 태그 줄 (주재료, 종류, 조리시간, 책 페이지, 찜, 공유) */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* 태그 메타 줄: 주재료 · 종류 · 조리시간 · 책 페이지 */}
              <div className="flex items-center gap-1.5 text-[13px] text-primary font-bold mb-1.5 flex-wrap">
                <span>{recipe.mainIngredient}</span>
                <span>·</span>
                <span>{recipe.category}</span>
                <span>·</span>
                <span>{recipe.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes}분` : '미확인'}</span>
                {recipe.bookPage && (
                  <>
                    <span>·</span>
                    <span className="text-ink-muted font-medium">p.{recipe.bookPage}</span>
                  </>
                )}
              </div>

              {/* 요리명 (굵은 볼드 24px) */}
              <h1 className="text-[24px] font-black text-ink tracking-tight leading-tight">
                {recipe.name}
              </h1>

              {recipe.description && (
                <p className="text-[14px] text-ink-secondary mt-2 leading-relaxed">
                  {recipe.description}
                </p>
              )}
            </div>

            {/* 우측 상단 액션: 찜 버튼 & 공유 버튼 */}
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`w-10 h-10 rounded-btn border flex items-center justify-center transition-all cursor-pointer ${
                  isFav
                    ? 'border-danger/30 bg-danger-light text-danger'
                    : 'border-line bg-white text-ink-muted hover:text-danger hover:border-danger'
                }`}
                aria-label={isFav ? '찜 해제' : '찜하기'}
                aria-pressed={isFav}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-danger' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-10 h-10 rounded-btn border border-line bg-white flex items-center justify-center text-ink-secondary hover:text-ink hover:border-ink transition-all cursor-pointer"
                aria-label="공유하기"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. 영양성분 섹션 (영양 데이터가 DB에 있는 요리만 표시! 없으면 완전히 미표시) */}
        {recipe.nutrition && <NutritionSection nutrition={recipe.nutrition} />}

        {/* 4. 재료 섹션 */}
        <IngredientsSection
          recipe={recipe}
          fridgeIngredients={fridgeIngredients}
          missingIngredientNames={missingIngredientNames}
          servings={servings}
          isLoggedIn={isLoggedIn}
          handleCopyIngredients={handleCopyIngredients}
          handleServingsChange={handleServingsChange}
          handleToggleCartItem={handleToggleCartItem}
          handleAddAllMissingToCart={handleAddAllMissingToCart}
        />

        {/* 5. 조리 순서 섹션 (책 원문 기준 단계) */}
        <StepsSection steps={recipe.steps ?? []} />
      </div>

      {/* 6. 하단 고정 액션 바: [오늘 기록에 추가] (기획서 4.3) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[630px] p-4 bg-white/95 backdrop-blur-md border-t border-line-subtle z-30">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddToTodayPlan}
          icon={<CalendarPlus className="w-5 h-5" />}
        >
          오늘 기록에 추가
        </Button>
      </div>

      {/* 로그인 유도 모달 (기획서 5장) */}
      {loginModal}

      {/* 토스트 알림 (기획서 4.3: 화면 이동 없이 '오늘 기록에 추가했어요' 피드백) */}
      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default RecipeDetailPage;
