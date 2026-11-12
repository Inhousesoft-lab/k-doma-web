import React, { useState, useEffect, useCallback } from 'react';
import {
  recommendationService,
  recipeService,
  subscribeToDataChanges,
  RecommendationResult,
  authService,
} from '../services';
import TodayRecommendations from './today/TodayRecommendations';
import StateView from '../components/common/StateView';
import useLoginGate from '../hooks/useLoginGate';

/**
 * Today (/) — 오늘 요리 추천에만 집중
 * 화면 순서: 헤더 → '오늘 한끼 뭐먹지?' 제목과 추천 그룹 → 하단 탭
 * (달력, 요리 카드, 구분선은 기록 탭 /records 로 이동 완료)
 */
export const TodayPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const currentUser = authService.getCurrentUser();

  const loadData = useCallback(async () => {
    try {
      const userId = authService.getCurrentUser().id;
      const recs = await recommendationService.getRecommendations(userId);
      setRecommendations(recs);
      setError(false);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadData();
    // 냉장고 재고 등 변경 시 추천 목록 자동 재계산
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const { requireLogin, loginModal } = useLoginGate();

  // 찜 상태 토글 (비로그인: 로그인 유도 모달 → 로그인하면 찜을 켠다)
  const handleToggleFavorite = async (recipeId: string) => {
    await requireLogin(() => recipeService.toggleFavorite(recipeId).then(() => undefined), {
      afterLogin: async () => {
        if (!recipeService.isFavorite(recipeId)) await recipeService.toggleFavorite(recipeId);
      },
      description: '찜하려면 로그인해 주세요.',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
        <StateView type="loading" title="오늘의 추천 메뉴를 불러오는 중이에요" />
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
      {/* '오늘 한끼 뭐먹지?' 추천 그룹 (가로 스크롤 카드 + 세로 목록 + 냉장고 비었을 때 안내) */}
      {recommendations && (
        <TodayRecommendations
          readyRecipes={recommendations.readyRecipes}
          needBuyRecipes={recommendations.needBuyRecipes}
          isFridgeEmpty={recommendations.isFridgeEmpty}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
      {loginModal}
    </div>
  );
};

export default TodayPage;
