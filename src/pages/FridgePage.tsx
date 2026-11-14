import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutList, Grid } from 'lucide-react';
import { Ingredient, IngredientStatus, StorageZone } from '../types';
import { ingredientService, authService } from '../services';
import useServiceData from '../hooks/useServiceData';
import StatusSignal, { STATUS_LABELS } from '../components/common/StatusSignal';
import StateView from '../components/common/StateView';
import IngredientImage from '../components/common/IngredientImage';
import Toast from '../components/common/Toast';
import useLoginGate from '../hooks/useLoginGate';
import FridgeZoneSection from './fridge/FridgeZoneSection';
import useZoneDrag from './fridge/useZoneDrag';

const FILTER_CHIPS: Array<{ value: 'ALL' | IngredientStatus; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'HAVE', label: STATUS_LABELS.HAVE },
  { value: 'LOW', label: STATUS_LABELS.LOW },
  { value: 'NONE', label: STATUS_LABELS.NONE },
];

const ZONES: Array<{ zone: StorageZone; title: string; caption?: string; addLabel: string; emptyText: string }> = [
  {
    zone: 'SEASONING',
    title: '양념 선반',
    addLabel: '양념 재료 추가',
    emptyText: '간장·고추장처럼 자주 쓰는 양념을 추가해 보세요.',
  },
  {
    zone: 'FRIDGE',
    title: '냉장고',
    caption: '냉장·냉동 통합',
    addLabel: '냉장고 재료 추가',
    emptyText: '집에 있는 재료를 추가하면 지금 만들 수 있는 요리를 알려 드려요.',
  },
];

export const FridgePage: React.FC = () => {
  // 1. 보기 모드 (기본: 아이콘형 icon - 와이어프레임 기본값)
  const [viewMode, setViewMode] = useState<'icon' | 'list'>('icon');

  // 2. 상태 필터 (전체 / 있음 / 적음 / 없음)
  const [statusFilter, setStatusFilter] = useState<'ALL' | IngredientStatus>('ALL');

  // 3. 재료 데이터 (비로그인 = 빈 냉장고, KD-47)
  // 불러오기 실패(네트워크·권한)는 빈 냉장고로 보이지 않게 오류 화면을 띄운다
  const {
    data: rawIngredients,
    setData: setRawIngredients,
    loading: isLoading,
    error: loadError,
    reload,
    retry,
  } = useServiceData(async () => (authService.isLoggedIn() ? ingredientService.getIngredients() : []));

  // 4. 재료 추가 화면(/fridge/add) 이동 · 돌아왔을 때 추가 개수 토스트
  const navigate = useNavigate();
  const location = useLocation();

  // 5. 로그인 유도 모달 (비로그인 [추가], KD-46). 화면은 로그인 여부와 관계없이 연다
  const { requireLogin, loginModal } = useLoginGate();

  // 6. 토스트 알림
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 7. 정렬 안정성을 위한 순서 고정 맵 (재료 ID -> 정렬 인덱스)
  const displayOrderRef = useRef<Map<string, number>>(new Map());

  // 정렬 함수: 있음(0) -> 적음(1) -> 없음(2), 같은 상태 내에서는 가나다순
  const sortIngredients = (list: Ingredient[]): Ingredient[] => {
    const statusWeight: Record<IngredientStatus, number> = {
      HAVE: 0,
      LOW: 1,
      NONE: 2,
    };
    return [...list].sort((a, b) => {
      const weightDiff = statusWeight[a.status] - statusWeight[b.status];
      if (weightDiff !== 0) return weightDiff;
      return a.name.localeCompare(b.name, 'ko');
    });
  };

  // 정렬 순서는 처음 불러올 때(또는 다시 시도할 때) 한 번 정하고 유지한다
  // → 상태를 바꿔도 타일이 자리를 옮기지 않는다. 새로 들어온 재료는 맨 뒤
  const ingredients = useMemo(() => {
    const list = rawIngredients ?? [];
    if (displayOrderRef.current.size === 0) {
      const sorted = sortIngredients(list);
      displayOrderRef.current = new Map(sorted.map((item, idx) => [item.id, idx]));
      return sorted;
    }
    return [...list].sort((a, b) => {
      const orderA = displayOrderRef.current.get(a.id) ?? 9999;
      const orderB = displayOrderRef.current.get(b.id) ?? 9999;
      return orderA - orderB;
    });
  }, [rawIngredients]);

  /** 정렬 순서를 새로 정하고 다시 불러온다 (오류 화면 [다시 시도]) */
  const retryWithNewOrder = () => {
    displayOrderRef.current = new Map();
    retry();
  };

  // 아이콘형 타일 클릭 시 상태 순환 (있음 -> 적음 -> 없음 -> 있음)
  const SAVE_FAILED = '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

  // 드래그앤드롭으로 구역 옮기기: 화면에 먼저 반영하고 바로 저장한다. 실패하면 원래대로 되돌린다
  const handleZoneDrop = async (ingredient: Ingredient, zone: StorageZone) => {
    setRawIngredients((prev) => (prev ?? []).map((i) => (i.id === ingredient.id ? { ...i, zone } : i)));
    try {
      await ingredientService.moveIngredientZone(ingredient.id, zone);
      setToastMessage(`'${ingredient.name}'을(를) ${zone === 'SEASONING' ? '양념 선반' : '냉장고'}으로 옮겼어요.`);
    } catch (e) {
      console.error(e);
      setToastMessage(SAVE_FAILED);
    }
    await reload();
  };

  const { drag, startPress, consumeClick } = useZoneDrag(handleZoneDrop);

  const handleTileClick = async (id: string) => {
    if (consumeClick()) return; // 끌어서 옮긴 직후의 클릭은 상태를 바꾸지 않는다
    try {
      await ingredientService.cycleIngredientStatus(id);
    } catch (e) {
      console.error(e);
      setToastMessage(SAVE_FAILED);
    }
    // order is preserved so tile does not bounce/reorder on screen
    await reload();
  };

  // 목록형 상태 직접 변경
  const handleStatusChange = async (id: string, newStatus: IngredientStatus) => {
    try {
      await ingredientService.updateIngredientStatus(id, newStatus);
    } catch (e) {
      console.error(e);
      setToastMessage(SAVE_FAILED);
    }
    await reload();
  };

  // 목록형 [빼기] (삭제)
  const handleRemove = async (id: string, name: string) => {
    let ok = false;
    try {
      ok = await ingredientService.removeIngredient(id);
    } catch (e) {
      console.error(e);
      setToastMessage(SAVE_FAILED);
    }
    if (ok) {
      displayOrderRef.current.delete(id);
      await reload();
      setToastMessage(`'${name}'을(를) 냉장고에서 뺐어요.`);
    }
  };

  // 재료 추가 화면에서 돌아오면 추가 개수 토스트. state 는 한 번 쓰고 비운다
  useEffect(() => {
    const addedCount = (location.state as { addedCount?: number } | null)?.addedCount;
    if (addedCount === undefined) return;
    if (addedCount > 0) setToastMessage(`${addedCount}개 재료가 추가되었어요.`);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]);

  // [추가]: 비로그인이면 로그인 유도 모달. 로그인하면 재료 추가 화면으로 이동 (전체 재료를 보여준다)
  const handleAdd = () => {
    const openAddPage = () => navigate('/fridge/add');
    requireLogin(openAddPage, {
      description: '냉장고에 재료를 추가하려면 로그인해 주세요.',
      afterLogin: openAddPage,
    });
  };

  // 상태별 개수 집계 (필터 칩용)
  const counts = useMemo(() => {
    const result: Record<IngredientStatus, number> = { HAVE: 0, LOW: 0, NONE: 0 };
    ingredients.forEach((item) => {
      result[item.status]++;
    });
    return result;
  }, [ingredients]);

  // 필터 적용된 목록
  const isFiltered = statusFilter !== 'ALL';

  const filteredIngredients = useMemo(() => {
    if (statusFilter === 'ALL') return ingredients;
    return ingredients.filter((item) => item.status === statusFilter);
  }, [ingredients, statusFilter]);

  // 구역별 분리 (양념 선반 / 냉장고)
  const seasoningList = useMemo(() => {
    return filteredIngredients.filter((item) => item.zone === 'SEASONING');
  }, [filteredIngredients]);

  const fridgeList = useMemo(() => {
    return filteredIngredients.filter((item) => item.zone === 'FRIDGE');
  }, [filteredIngredients]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
        <StateView type="loading" title="냉장고 재료를 불러오는 중이에요" />
      </div>
    );
  }

  // 불러오기 실패: [다시 시도]하면 서비스가 구독을 다시 시작한다
  if (loadError) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
        <StateView
          type="error"
          title="냉장고 재료를 불러오지 못했어요"
          description="네트워크 연결을 확인하고 다시 시도해 주세요."
          onAction={retryWithNewOrder}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-3 pb-8 gap-4 bg-white">
      {/* 1. 상단 바: 제목 '냉장고' + 목록형/아이콘형 세그먼트 토글 */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-ink tracking-tight">
          냉장고
        </h2>

        {/* 와이어프레임 토글: [ ≡ ] [ ⊞ ] (기본 아이콘형) */}
        <div className="inline-flex items-center bg-fill p-1 rounded-[12px] h-[36px]" role="group">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-[9px] transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink-secondary'
            }`}
            aria-label="목록형 보기"
            title="목록형"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('icon')}
            className={`p-1.5 rounded-[9px] transition-all cursor-pointer ${
              viewMode === 'icon'
                ? 'bg-white text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink-secondary'
            }`}
            aria-label="아이콘형 보기"
            title="아이콘형"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 상태 필터 칩 (전체 / ● 있음 n / ◐ 적음 n / ◌ 없음 n) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setStatusFilter(chip.value)}
            className={`flex items-center gap-1.5 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 cursor-pointer ${
              chip.value === 'ALL' ? 'px-3.5' : 'px-3'
            } ${
              statusFilter === chip.value
                ? 'bg-ink text-white shadow-2xs'
                : 'bg-white border border-line text-ink-secondary hover:bg-fill-subtle'
            }`}
          >
            {chip.value !== 'ALL' && <StatusSignal status={chip.value} size={12} />}
            <span>
              {chip.label}
              {chip.value !== 'ALL' && ` ${counts[chip.value]}`}
            </span>
          </button>
        ))}
      </div>

      {/* 3·4. 구역 카드: 양념 선반 / 냉장고 (냉장·냉동 통합) */}
      {ZONES.map((zone) => (
        <FridgeZoneSection
          key={zone.zone}
          zone={zone.zone}
          title={zone.title}
          caption={zone.caption}
          addLabel={zone.addLabel}
          emptyText={zone.emptyText}
          items={zone.zone === 'SEASONING' ? seasoningList : fridgeList}
          viewMode={viewMode}
          isFiltered={isFiltered}
          onTileClick={handleTileClick}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
          onAdd={handleAdd}
          onTilePointerDown={startPress}
          draggingId={drag?.ingredient.id ?? null}
          isDropTarget={Boolean(drag && drag.overZone === zone.zone && drag.ingredient.zone !== zone.zone)}
        />
      ))}

      {/* 끌고 있는 타일 (손가락·마우스를 따라다님) */}
      {drag && (
        <div
          className="fixed z-50 pointer-events-none w-[84px] h-[88px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-between p-1.5 border border-line bg-white rounded-[16px] shadow-lg scale-105"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <IngredientImage
            name={drag.ingredient.name}
            imageKey={drag.ingredient.imageKey}
            className="w-12 h-12 mt-0.5 rounded-[10px]"
          />
          <div className="w-full flex items-center justify-center gap-1 px-0.5 mb-0.5 min-w-0">
            <StatusSignal status={drag.ingredient.status} size={12} className="shrink-0" />
            <span className="text-[12px] font-medium text-ink truncate leading-tight">{drag.ingredient.name}</span>
          </div>
        </div>
      )}

      {/* 5. 안내 문구 (와이어프레임 하단 텍스트) */}
      <p className="text-[12px] text-ink-muted leading-relaxed text-center px-1 pt-1 pb-4">
        재료를 누르면 있음 → 적음 → 없음 순으로 바뀝니다. 적음·없음인 재료는 장바구니 '더 사두면 좋아요'에 나와요.
        {viewMode === 'icon' && (
          <>
            <br />
            재료를 길게 누른 채 끌면 양념 선반 ↔ 냉장고로 옮길 수 있어요.
          </>
        )}
      </p>

      {/* 8. 로그인 유도 모달 (비로그인 [추가]) */}
      {loginModal}

      {/* 7. 토스트 피드백 */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          isVisible={Boolean(toastMessage)}
          onClose={() => setToastMessage(null)}
          duration={2500}
        />
      )}
    </div>
  );
};

export default FridgePage;
