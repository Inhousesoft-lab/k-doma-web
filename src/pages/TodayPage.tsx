import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  recommendationService,
  recipeService,
  subscribeToDataChanges,
  authService,
  type TodayRecipeItem,
  type TodayThemeSection,
} from '../services';
import { TODAY_RECOMMEND_COUNT } from '../recommendation';
import TodayRecommendations from './today/TodayRecommendations';
import StateView from '../components/common/StateView';
import useLoginGate from '../hooks/useLoginGate';

/**
 * Today (/) — 오늘 요리 추천에만 집중
 * 화면 순서: 헤더 → 추천 요리('오늘 한끼 뭐먹지?') → 테마 요리 → 하단 탭 (KD-51)
 * (달력, 요리 카드, 구분선은 기록 탭 /records 로 이동 완료)
 */
export const TodayPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<{
    recommended: TodayRecipeItem[];
    themes: TodayThemeSection[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  /** 테마 새로고침 횟수. 재고가 바뀌어 다시 불러와도 지금 보던 테마를 유지한다 */
  const themeRoundRef = useRef<number>(0);

  const currentUser = authService.getCurrentUser();

  const loadData = useCallback(async () => {
    try {
      const userId = authService.getCurrentUser().id;
      const [recs, themes] = await Promise.all([
        recommendationService.getRecommendations(userId),
        recommendationService.getThemes(themeRoundRef.current),
      ]);
      setRecommendations({
        recommended: recs
          .slice(0, TODAY_RECOMMEND_COUNT)
          .map(({ recipe, missingCount }) => ({ recipe, missingCount })),
        themes,
      });
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

  // 추천 테마 새로고침: 오늘 섞은 순서에서 다음 테마로 바꾼다 (추천 요리는 그대로)
  const handleRefreshTheme = async () => {
    themeRoundRef.current += 1;
    try {
      const themes = await recommendationService.getThemes(themeRoundRef.current);
      setRecommendations((prev) => (prev ? { ...prev, themes } : prev));
    } catch (e) {
      console.error(e);
    }
  };

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
      {/* 추천 요리 + 테마 요리 (냉장고가 비어 있어도 그대로 보여 준다, KD-50·51) */}
      {recommendations && (
        <TodayRecommendations
          recommended={recommendations.recommended}
          themes={recommendations.themes}
          showStock={authService.isLoggedIn()}
          onToggleFavorite={handleToggleFavorite}
          onRefreshTheme={handleRefreshTheme}
        />
      )}
      {loginModal}
    </div>
  );
};

export default TodayPage;
