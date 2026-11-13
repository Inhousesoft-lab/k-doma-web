import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  CalendarPlus,
  Copy,
} from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import { todayStr } from '../utils/date';
import { fridgeStatusOf, getMissingIngredientNames } from '../utils/ingredient';
import {
  recipeService,
  ingredientService,
  cartService,
  mealPlanService,
  authService,
  subscribeToDataChanges,
  DuplicatePlanError,
  PlanLimitError,
} from '../services';
import StatusSignal from '../components/common/StatusSignal';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import useLoginGate from '../hooks/useLoginGate';
import { scaleAmount } from '../utils/amount';
import StateView from '../components/common/StateView';
import NoImage from '../components/common/NoImage';

export const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();

  // 데이터 상태
  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined);
  const [fridgeIngredients, setFridgeIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

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

  const loadData = useCallback(async () => {
    if (!recipeId) return;
    try {
      const [r, ingredients] = await Promise.all([
        recipeService.getRecipeById(recipeId),
        ingredientService.getIngredients(),
      ]);

      if (!r) {
        setError(true);
      } else {
        setRecipe(r);
        if (servingsInitializedFor.current !== r.id) {
          servingsInitializedFor.current = r.id;
          setServings(r.servings || 2);
        }
        setFridgeIngredients(ingredients);
        setError(false);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

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
    if (!recipe?.ingredientsRequired?.length) return;
    const text = recipe.ingredientsRequired
      .map((item) => `${item.name} ${scaleAmount(item.amount, servings, recipe.servings || 2)}`.trim())
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
                <span>{recipe.isVerified !== false ? `${recipe.cookTimeMinutes}분` : '미확인'}</span>
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
        {recipe.nutrition && (
          <section className="bg-white rounded-card p-4.5 border border-line">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold text-ink">영양성분</h3>
              <span className="text-[12px] text-ink-muted">
                1인분 · 재료 분석 추정치
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-fill rounded-[12px] py-2 px-1">
                <span className="block text-[11px] text-ink-muted font-medium">칼로리</span>
                <span className="block text-[14px] font-bold text-ink mt-0.5">
                  {recipe.nutrition.calories}kcal
                </span>
              </div>
              <div className="bg-fill rounded-[12px] py-2 px-1">
                <span className="block text-[11px] text-ink-muted font-medium">탄수화물</span>
                <span className="block text-[14px] font-bold text-ink mt-0.5">
                  {recipe.nutrition.carbs}g
                </span>
              </div>
              <div className="bg-fill rounded-[12px] py-2 px-1">
                <span className="block text-[11px] text-ink-muted font-medium">단백질</span>
                <span className="block text-[14px] font-bold text-ink mt-0.5">
                  {recipe.nutrition.protein}g
                </span>
              </div>
              <div className="bg-fill rounded-[12px] py-2 px-1">
                <span className="block text-[11px] text-ink-muted font-medium">지방</span>
                <span className="block text-[14px] font-bold text-ink mt-0.5">
                  {recipe.nutrition.fat}g
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 4. 재료 섹션 */}
        <section className="bg-white rounded-card p-4.5 border border-line">
          {/* 헤더: 필요한 재료 + 인분 조절 (−/+) */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-line-subtle">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[16px] font-bold text-ink">필요한 재료</h3>
                <button
                  type="button"
                  onClick={handleCopyIngredients}
                  className="flex items-center gap-1 px-2 py-1 rounded-[8px] bg-fill text-[12px] font-bold text-ink-secondary cursor-pointer"
                  aria-label="재료 복사"
                >
                  <Copy className="w-3.5 h-3.5" />
                  복사
                </button>
              </div>
              {/* 비로그인 상태에서는 상태 신호 범례 숨김 (기획서 4.4) */}
              {isLoggedIn && (
                <span className="text-[11px] text-ink-muted">
                  ● 있음 · ◐ 적음 · ◌ 없음
                </span>
              )}
            </div>

            {/* 인분 수 컨트롤러 (−/+) */}
            <div className="flex items-center gap-2 bg-fill px-2 py-1 rounded-[12px]">
              <button
                type="button"
                onClick={() => handleServingsChange(-1)}
                disabled={servings <= 1}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink disabled:opacity-30 cursor-pointer shadow-2xs"
                aria-label="인분 줄이기"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[13px] font-bold text-ink min-w-[36px] text-center">
                {servings}인분
              </span>
              <button
                type="button"
                onClick={() => handleServingsChange(1)}
                disabled={servings >= 8}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink disabled:opacity-30 cursor-pointer shadow-2xs"
                aria-label="인분 늘리기"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 재료 목록 행 */}
          <div className="flex flex-col divide-y divide-line-subtle">
            {recipe.ingredientsRequired?.map((item) => {
              // 보유 상태 확인
              const matchedStatus = fridgeStatusOf(item.name, fridgeIngredients);
              const isInCart = cartService.isItemInCart(item.name);
              const scaledQty = scaleAmount(item.amount, servings, recipe.servings || 2);

              return (
                <div
                  key={item.name}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  {/* 좌측: 상태 신호(로그인 상태만) + 재료명(적음이면 '양 확인') */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isLoggedIn && (
                      <StatusSignal status={matchedStatus} size={14} />
                    )}
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[15px] font-bold text-ink truncate">
                        {item.name}
                      </span>
                      {isLoggedIn && matchedStatus === 'LOW' && (
                        <span className="text-[11px] font-bold text-warning bg-warning-light px-1.5 py-0.5 rounded-full shrink-0">
                          양 확인
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 우측: 수량 + 장바구니 버튼 */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13px] text-ink-muted">
                      {scaledQty}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleCartItem(item.name)}
                      className={`h-[30px] px-2.5 rounded-full text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isInCart
                          ? 'bg-mint-bg text-mint border border-mint/30'
                          : 'bg-fill text-ink hover:bg-line'
                      }`}
                      aria-label={isInCart ? '장바구니에서 빼기' : '장바구니에 담기'}
                    >
                      {isInCart ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>담김</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>담기</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 없는 재료 일괄 추가 버튼 */}
          <div className="mt-4 pt-3 border-t border-line-subtle">
            {missingIngredientNames.length > 0 ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleAddAllMissingToCart(missingIngredientNames)}
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                없는 재료 {missingIngredientNames.length}개 모두 장바구니에 추가
              </Button>
            ) : (
              <div className="p-3 bg-mint-bg rounded-btn text-center text-[13px] font-bold text-mint flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>모든 재료가 냉장고에 준비되어 있어요</span>
              </div>
            )}
          </div>
        </section>

        {/* 5. 조리 순서 섹션 (책 원문 기준 단계) */}
        <section className="bg-white rounded-card p-4.5 border border-line">
          <h3 className="text-[16px] font-bold text-ink mb-3">
            조리 순서
          </h3>

          <div className="flex flex-col gap-3.5">
            {recipe.steps?.map((stepText, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-[14px] text-ink leading-relaxed flex-1 pt-0.5">
                  {stepText}
                </p>
              </div>
            ))}
          </div>
        </section>
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
