import React, { useState, useCallback, useEffect } from 'react';
import { Calendar as CalendarIcon, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MealPlan, Recipe } from '../types';
import useServiceData from '../hooks/useServiceData';
import {
  mealPlanService,
  recipeService,
  authService,
} from '../services';
import Calendar from '../components/calendar/Calendar';
import PlanCard from '../components/plan/PlanCard';
import InventoryUpdateSheet from '../components/plan/InventoryUpdateSheet';
import StateView from '../components/common/StateView';
import LoginNoticeBox from '../components/common/LoginNoticeBox';
import NoticeBox from '../components/common/NoticeBox';
import ViewToggle, { RecordsViewMode } from '../components/records/ViewToggle';
import RecordsTimeline from '../components/records/RecordsTimeline';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { addMonths, formatYearMonth, parseDateStr, todayStr } from '../utils/date';

const SAVE_FAILED = '저장하지 못했어요. 다시 시도해 주세요';
const LOAD_FAILED = '기록을 불러오지 못했어요. 다시 시도해 주세요';

/**
 * 기록 탭 (KD-43, KD-57)
 * - 가구의 요리 기록을 달력으로 본다. 다른 구성원의 기록도 바로 반영된다 (실시간)
 * - 선택한 날짜의 요리 카드를 모두 보여 준다 (하루 최대 10개, 추가한 순)
 * - 보기 전환 [달력 | 타임라인] (달력 위 오른쪽). 기본 = 달력. 탭을 다시 열면 달력으로 시작
 * - 타임라인: 요리 완료한 날만, 최신 날짜가 위. 카드는 달력 보기와 같은 PlanCard
 * - 달력 보기에서 고른 날에 기록이 없으면 안내 박스. [요리 보러 가기]는 오늘만 (기록은 오늘 날짜로만 추가된다)
 * - 기록은 지난달 1일부터 받는다. 달력에서 이전 달로 가면 그 전 달부터 더 받고(앞쪽 흐린 칸 점),
 *   타임라인은 아래 [N월 기록 더 보기]로 한 달씩 더 받는다 (요리 완료 없는 달은 건너뛴다)
 */
export const RecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [viewMode, setViewMode] = useState<RecordsViewMode>('calendar');
  // 로그인 상태 (비로그인이어도 화면은 연다, KD-48)
  // 비로그인: 기록이 없다 → 달력에 점이 없고, 달력 아래는 로그인 안내 박스
  // 카드에 요리 시간·칼로리·탄단지를 보여 주려고 레시피를 id로 찾는다
  const { data, loading, error, retry } = useServiceData(async () => {
    if (!authService.isLoggedIn()) {
      return { isLoggedIn: false, plans: [] as MealPlan[], recipesById: new Map<string, Recipe>() };
    }
    const [plans, recipes] = await Promise.all([mealPlanService.getPlans(), recipeService.getRecipes()]);
    return { isLoggedIn: true, plans, recipesById: new Map(recipes.map((r) => [r.id, r])) };
  });
  const plans = data?.plans ?? [];
  const recipesById = data?.recipesById ?? new Map<string, Recipe>();
  const isLoggedIn = data?.isLoggedIn ?? authService.isLoggedIn();

  // 재고 변경 바텀시트
  const [isInventorySheetOpen, setIsInventorySheetOpen] = useState<boolean>(false);
  const [sheetTargetPlan, setSheetTargetPlan] = useState<MealPlan | null>(null);

  // 요리 완료 [삭제] 확인 창
  const [deleteTarget, setDeleteTarget] = useState<MealPlan | null>(null);

  // 저장 중인 카드 (연속 누름 방지)
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'info' | 'error'>('info');
  const [showToast, setShowToast] = useState<boolean>(false);
  const showToastMessage = (message: string, type: 'info' | 'error' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };
  const hideToast = useCallback(() => setShowToast(false), []);

  const dayPlans = plans.filter((p) => p.date === selectedDate);
  const cookedPlans = plans.filter((p) => p.status === 'COOKED');
  const isTodaySelected = selectedDate === todayStr();

  // 이전 달 기록 더 받기
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState<boolean>(false);
  const canLoadMore = isLoggedIn && mealPlanService.canLoadMorePlans();
  const loadedFrom = mealPlanService.plansLoadedFrom();
  const nextMonth = loadedFrom ? addMonths(loadedFrom, -1) : null;
  const nextMonthLabel = nextMonth
    ? parseDateStr(nextMonth).year === parseDateStr(todayStr()).year
      ? `${parseDateStr(nextMonth).monthIndex + 1}월`
      : formatYearMonth(nextMonth)
    : '';

  const handleChangeView = (mode: RecordsViewMode) => {
    setLoadMoreFailed(false);
    setViewMode(mode);
  };

  // 타임라인 [더 보기] (요리 완료 없는 달은 건너뛴다)
  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      await mealPlanService.loadOlderCookedMonth();
    } catch (e) {
      console.error(e);
      setLoadMoreFailed(true);
      showToastMessage(LOAD_FAILED, 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  // 달력: 보고 있는 달의 전 달부터 받는다 (펼친 달력 앞쪽 흐린 칸·접힌 주의 지난달 날짜 점)
  const viewMonth = addMonths(selectedDate, 0);
  useEffect(() => {
    if (!isLoggedIn) return;
    mealPlanService.ensurePlansFrom(addMonths(viewMonth, -1)).catch((e) => {
      console.error(e);
      showToastMessage(LOAD_FAILED, 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, viewMonth]);

  // 타임라인: 받은 범위에 요리 완료가 없으면 있는 달(또는 서비스 시작 달)까지 자동으로 더 받는다
  const needsAutoLoad =
    viewMode === 'timeline' && isLoggedIn && !loading && cookedPlans.length === 0 && canLoadMore && !loadMoreFailed;
  useEffect(() => {
    if (needsAutoLoad) void handleLoadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAutoLoad]);

  /** 카드 버튼 동작. 실패하면 토스트. 기록이 바뀌면 구독이 화면을 다시 그린다 */
  const runPlanAction = async (planId: string, action: () => Promise<void>) => {
    if (busyPlanId) return;
    setBusyPlanId(planId);
    try {
      await action();
    } catch (e) {
      console.error(e);
      showToastMessage(SAVE_FAILED, 'error');
    } finally {
      setBusyPlanId(null);
    }
  };

  // [요리 완료] → COOKED, 점이 ●로 바뀜
  const handleCompletePlan = (planId: string) =>
    runPlanAction(planId, () => mealPlanService.markPlanCooked(planId));

  // 요리 예정 [취소] → 확인 없이 기록 삭제
  const handleCancelPlan = (planId: string) =>
    runPlanAction(planId, () => mealPlanService.deletePlan(planId));

  // 요리 완료 [삭제] → 확인 창 → 기록 삭제 (재고는 그대로)
  const handleConfirmDelete = () => {
    const target = deleteTarget;
    if (!target) return;
    runPlanAction(target.id, () => mealPlanService.deletePlan(target.id));
  };

  // 재료 변경 시트 열기
  const handleOpenInventorySheet = (plan: MealPlan) => {
    setSheetTargetPlan(plan);
    setIsInventorySheetOpen(true);
  };

  // 요리 카드 (달력 보기·타임라인 보기 공통)
  const renderPlanCard = (plan: MealPlan) => (
    <PlanCard
      plan={plan}
      recipe={recipesById.get(plan.recipeId)}
      busy={busyPlanId === plan.id}
      onComplete={handleCompletePlan}
      onCancel={handleCancelPlan}
      onDelete={setDeleteTarget}
      onOpenInventorySheet={handleOpenInventorySheet}
    />
  );

  const loginNotice = (
    <LoginNoticeBox
      icon={<CalendarIcon className="w-8 h-8 text-ink-disabled" aria-hidden="true" />}
      title="요리 기록을 보려면 로그인해 주세요."
      description="로그인하면 내가 만든 요리와 예정한 요리가 달력에 표시돼요."
      returnTo="/records"
    />
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
        <StateView type="loading" title="기록을 불러오는 중이에요" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
        <StateView
          type="error"
          title="화면을 불러오지 못했어요"
          description="네트워크 상태를 확인하고 다시 시도해주세요."
          actionText="다시 시도"
          onAction={retry}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-3 pb-8 gap-4 bg-white min-h-[calc(100vh-80px)]">
      {/* 0. 보기 전환 토글: 오른쪽 끝 */}
      <div className="flex items-center justify-end">
        <ViewToggle value={viewMode} onChange={handleChangeView} />
      </div>

      {viewMode === 'calendar' ? (
        <>
          {/* 1. 달력: 연월 접힘/펼침, 요일 줄, 접힌 상태 1주, 선택일 검은 원, 완료● / 예정○ 점 */}
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} plans={plans} />

          {/* 2. 로그인: 선택한 날짜의 요리 카드 모두. 없으면 안내 박스 ([요리 보러 가기]는 오늘만)
                 비로그인: 어느 날짜를 골라도 로그인 안내 박스 (KD-48) */}
          {!isLoggedIn ? (
            loginNotice
          ) : dayPlans.length > 0 ? (
            <div className="flex flex-col gap-3">
              {dayPlans.map((plan) => (
                <React.Fragment key={plan.id}>{renderPlanCard(plan)}</React.Fragment>
              ))}
            </div>
          ) : (
            <NoticeBox
              icon={<Utensils className="w-8 h-8 text-ink-disabled" aria-hidden="true" />}
              title="이 날은 요리 기록이 없어요"
              description={isTodaySelected ? '레시피에서 [오늘 기록에 추가]를 누르면\n여기에 표시돼요.' : '요리를 기록한 날에는 달력에 점이 표시돼요.'}
              actionText={isTodaySelected ? '요리 보러 가기' : undefined}
              onAction={isTodaySelected ? () => navigate('/recipes') : undefined}
            />
          )}
        </>
      ) : !isLoggedIn ? (
        loginNotice
      ) : cookedPlans.length === 0 && (loadingMore || needsAutoLoad) ? (
        <StateView type="loading" title="기록을 불러오는 중이에요" className="grow" />
      ) : cookedPlans.length === 0 && loadMoreFailed && canLoadMore ? (
        <StateView
          type="error"
          title="기록을 불러오지 못했어요"
          description="네트워크 상태를 확인하고 다시 시도해주세요."
          actionText="다시 시도"
          onAction={handleLoadMore}
          className="grow"
        />
      ) : cookedPlans.length === 0 ? (
        <StateView
          type="empty"
          title="아직 완성한 요리가 없어요"
          description="요리를 완성하면 날짜별로 여기에 쌓여요."
          actionText="요리 보러 가기"
          onAction={() => navigate('/recipes')}
          className="grow"
        />
      ) : (
        <RecordsTimeline
          plans={cookedPlans}
          renderCard={renderPlanCard}
          loadMoreLabel={canLoadMore ? `${nextMonthLabel} 기록 더 보기` : null}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
        />
      )}

      {/* 3. 재고 변경 바텀시트 (로그인 상태에서만) */}
      {isLoggedIn && (
        <InventoryUpdateSheet
          isOpen={isInventorySheetOpen}
          onClose={() => setIsInventorySheetOpen(false)}
          plan={sheetTargetPlan}
          onNotice={showToastMessage}
        />
      )}

      {/* 4. 요리 완료 [삭제] 확인 창 (KD-57) */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="이 요리 기록을 삭제할까요?"
        description="냉장고 재고는 바뀌지 않아요."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleConfirmDelete}
      />

      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={hideToast} />
    </div>
  );
};

export default RecordsPage;
