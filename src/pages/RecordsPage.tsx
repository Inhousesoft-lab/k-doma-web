import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { MealPlan, Recipe } from '../types';
import {
  mealPlanService,
  recipeService,
  authService,
  subscribeToDataChanges,
} from '../services';
import Calendar from '../components/calendar/Calendar';
import PlanCard from '../components/plan/PlanCard';
import InventoryUpdateSheet from '../components/plan/InventoryUpdateSheet';
import StateView from '../components/common/StateView';
import LoginNoticeBox from '../components/common/LoginNoticeBox';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { todayStr } from '../utils/date';

const SAVE_FAILED = '저장하지 못했어요. 다시 시도해 주세요';

/**
 * 기록 탭 (KD-43, KD-57)
 * - 가구의 요리 기록을 달력으로 본다. 다른 구성원의 기록도 바로 반영된다 (실시간)
 * - 선택한 날짜의 요리 카드를 모두 보여 준다 (하루 최대 10개, 추가한 순)
 */
export const RecordsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [plans, setPlans] = useState<MealPlan[]>([]);
  // 카드에 요리 시간·칼로리·탄단지를 보여 주려고 레시피를 id로 찾는다
  const [recipesById, setRecipesById] = useState<Map<string, Recipe>>(new Map());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // 로그인 상태 (비로그인이어도 화면은 연다, KD-48)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(authService.isLoggedIn());

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

  const loadData = useCallback(async () => {
    if (!authService.isLoggedIn()) {
      // 비로그인: 기록이 없다 → 달력에 점이 없고, 달력 아래는 로그인 안내 박스
      setIsLoggedIn(false);
      setPlans([]);
      setError(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    try {
      const [nextPlans, recipes] = await Promise.all([mealPlanService.getPlans(), recipeService.getRecipes()]);
      setPlans(nextPlans);
      setRecipesById(new Map(recipes.map((r) => [r.id, r])));
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
      setIsLoggedIn(authService.isLoggedIn());
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const dayPlans = plans.filter((p) => p.date === selectedDate);

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
          onAction={loadData}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-3 pb-8 gap-4 bg-white min-h-[calc(100vh-80px)]">
      {/* 1. 달력: 연월 접힘/펼침, 요일 줄, 접힌 상태 1주, 선택일 검은 원, 완료● / 예정○ 점 */}
      <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} plans={plans} />

      {/* 2. 로그인: 선택한 날짜의 요리 카드 모두 (없으면 카드 영역 숨기고 비워 둠)
             비로그인: 어느 날짜를 골라도 로그인 안내 박스 (KD-48) */}
      {isLoggedIn ? (
        dayPlans.length > 0 && (
          <div className="flex flex-col gap-3">
            {dayPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                recipe={recipesById.get(plan.recipeId)}
                busy={busyPlanId === plan.id}
                onComplete={handleCompletePlan}
                onCancel={handleCancelPlan}
                onDelete={setDeleteTarget}
                onOpenInventorySheet={handleOpenInventorySheet}
              />
            ))}
          </div>
        )
      ) : (
        <LoginNoticeBox
          icon={<CalendarIcon className="w-8 h-8 text-ink-disabled" aria-hidden="true" />}
          title="요리 기록을 보려면 로그인해 주세요."
          description="로그인하면 내가 만든 요리와 예정한 요리가 달력에 표시돼요."
          returnTo="/records"
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
