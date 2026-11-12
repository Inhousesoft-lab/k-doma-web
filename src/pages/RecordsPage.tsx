import React, { useState, useEffect, useCallback } from 'react';
import { MealPlan } from '../types';
import {
  mealPlanService,
  authService,
  subscribeToDataChanges,
} from '../services';
import Calendar from '../components/calendar/Calendar';
import PlanCard from '../components/plan/PlanCard';
import InventoryUpdateSheet from '../components/plan/InventoryUpdateSheet';
import StateView from '../components/common/StateView';
import RecordsLoginBox from './records/RecordsLoginBox';
import { todayStr } from '../utils/date';


export const RecordsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | undefined>(undefined);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // 로그인 상태 (비로그인이어도 화면은 연다, KD-48)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(authService.isLoggedIn());

  // 재고 변경 바텀시트
  const [isInventorySheetOpen, setIsInventorySheetOpen] = useState<boolean>(false);
  const [sheetTargetPlan, setSheetTargetPlan] = useState<MealPlan | null>(null);

  const currentUser = authService.getCurrentUser();

  const loadData = useCallback(async () => {
    if (!authService.isLoggedIn()) {
      // 비로그인: 기록이 없다 → 달력에 점이 없고, 달력 아래는 로그인 안내 박스
      setIsLoggedIn(false);
      setPlans([]);
      setCurrentPlan(undefined);
      setError(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    try {
      const userId = authService.getCurrentUser().id;
      const [userPlans, planForDate] = await Promise.all([
        mealPlanService.getUserPlans(userId),
        mealPlanService.getPlanByDate(selectedDate, userId),
      ]);

      setPlans(userPlans);
      setCurrentPlan(planForDate);
      setError(false);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, currentUser.id]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      setIsLoggedIn(authService.isLoggedIn());
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // 날짜 선택
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  // 요리 완료 확정 ([요리 완료] -> COOKED, 점이 ●로 바뀜)
  const handleCompletePlan = async (planId: string) => {
    await mealPlanService.markPlanCooked(planId);
    await loadData();
  };

  // 요리 계획 취소 ([취소] -> CANCELED, 카드와 점 사라짐)
  const handleCancelPlan = async (planId: string) => {
    await mealPlanService.cancelPlan(planId);
    await loadData();
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
      <Calendar
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        plans={plans}
      />

      {/* 2. 로그인: 선택한 날짜의 요리 카드 (요리가 있을 때만 표시. 없으면 카드 영역 숨기고 비워 둠)
             비로그인: 어느 날짜를 골라도 로그인 안내 박스 (KD-48) */}
      {isLoggedIn ? (
        currentPlan && (
          <PlanCard
            plan={currentPlan}
            onComplete={handleCompletePlan}
            onCancel={handleCancelPlan}
            onOpenInventorySheet={handleOpenInventorySheet}
          />
        )
      ) : (
        <RecordsLoginBox />
      )}

      {/* 3. 재고 변경 바텀시트 (로그인 상태에서만) */}
      {isLoggedIn && (
        <InventoryUpdateSheet
          isOpen={isInventorySheetOpen}
          onClose={() => setIsInventorySheetOpen(false)}
          plan={sheetTargetPlan}
          onSaved={loadData}
        />
      )}

    </div>
  );
};

export default RecordsPage;
