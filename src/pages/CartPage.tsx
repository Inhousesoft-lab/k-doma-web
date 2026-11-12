import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from '../types';
import { cartService, authService, subscribeToDataChanges } from '../services';
import StatusSignal from '../components/common/StatusSignal';
import StateView from '../components/common/StateView';
import Toast from '../components/common/Toast';
import LoginNoticeBox from '../components/common/LoginNoticeBox';
import CartUrgentRow from './cart/CartUrgentRow';
import CartExtraRow, { ExtraIngredientItem } from './cart/CartExtraRow';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. 장바구니 항목들 (꼭 사야 해요)
  const [urgentItems, setUrgentItems] = useState<CartItem[]>([]);

  // 2. 냉장고 적음·없음 항목들 (더 사두면 좋아요)
  const [extraItems, setExtraItems] = useState<ExtraIngredientItem[]>([]);

  // 3. 로딩 상태 (비로그인은 불러올 데이터가 없어 로딩을 켜지 않는다)
  const [isLoading, setIsLoading] = useState<boolean>(() => authService.isLoggedIn());

  // 4. 로그인 상태 (KD-27 장바구니는 계정별). 비로그인이어도 화면은 연다 (KD-49)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(authService.isLoggedIn());

  // 5. 토스트 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('info');

  // 6. 하단 버튼 제출 중 상태 (중복 클릭 방지)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    // 비로그인: 데이터를 불러오지 않는다 → 두 영역 모두 0개 (KD-49)
    if (!authService.isLoggedIn()) {
      setUrgentItems([]);
      setExtraItems([]);
      return;
    }

    const [cart, needBuy] = await Promise.all([
      cartService.getCartItems(),
      cartService.getNeedBuyFromFridge(),
    ]);

    // 꼭 사야 해요 (isUrgent: true 또는 기본 장바구니 품목)
    setUrgentItems(cart);

    // 더 사두면 좋아요 (냉장고 적음·없음 중 장바구니에 없는 것)
    setExtraItems(needBuy);
  }, []);

  useEffect(() => {
    setIsLoading(authService.isLoggedIn());
    loadData().finally(() => {
      setIsLoading(false);
    });

    const unsubscribe = subscribeToDataChanges(() => {
      setIsLoggedIn(authService.isLoggedIn());
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);


  // 꼭 사야 해요 체크 토글 (체크는 '샀다' 표시일 뿐, 재고는 즉시 안 바뀜)
  const handleToggleCheck = async (id: string) => {
    await cartService.toggleItemCheck(id);
    await loadData();
  };

  // [집에 있어요] 클릭: 냉장고에 있음으로 저장하고 목록에서 지움
  const handleMarkInFridge = async (item: CartItem) => {
    await cartService.markAsInFridge(item.name, item.id);
    await loadData();
    setToastType('success');
    setToastMessage(`'${item.name}'을(를) 냉장고에 '있음'으로 등록했어요.`);
  };

  // [+ 살 목록에] 클릭: 더 사두면 좋아요에서 꼭 사야 해요로 이동
  const handleMoveToUrgent = async (name: string) => {
    await cartService.moveToUrgentCart(name);
    await loadData();
    setToastType('info');
    setToastMessage(`'${name}'을(를) 꼭 사야 해요에 추가했어요.`);
  };

  // 체크된 수량 집계
  const checkedCount = useMemo(() => {
    return urgentItems.filter((i) => i.checked).length;
  }, [urgentItems]);

  // [체크한 n개 냉장고에 등록] 클릭
  const handleRegisterChecked = async () => {
    if (checkedCount === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const checkedIds = urgentItems.filter((i) => i.checked).map((i) => i.id);
      const { successIds, failedIds } = await cartService.registerCheckedToFridge(checkedIds);

      await loadData();

      if (failedIds.length > 0) {
        // KD-36: 실패한 항목은 체크된 채로 남기고 에러 토스트 노출
        setToastType('error');
        setToastMessage('실패하였습니다. 다시 시도해 주시거나 관리자 문의를 부탁드립니다.');
      } else {
        setToastType('success');
        setToastMessage(`${successIds.length}개 재료가 냉장고에 '있음'으로 등록되었어요.`);
      }
    } catch {
      setToastType('error');
      setToastMessage('실패하였습니다. 다시 시도해 주시거나 관리자 문의를 부탁드립니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
        <StateView type="loading" title="장바구니를 불러오는 중이에요" />
      </div>
    );
  }

  // 완전히 비어 있는 상태 (7항). 로그인 상태에서만 쓴다 (비로그인은 두 영역 + 로그인 안내 박스, KD-49)
  const isAllEmpty = urgentItems.length === 0 && extraItems.length === 0;
  if (isLoggedIn && isAllEmpty) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
        <StateView
          type="empty"
          title="아직 담은 재료가 없어요"
          description="요리 상세에서 필요한 재료를 담거나,&#10;냉장고에서 부족한 재료를 확인해보세요."
          actionText="요리 보러 가기"
          onAction={() => navigate('/recipes')}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col px-5 pt-3 ${isLoggedIn ? 'pb-32' : 'pb-8'} gap-6 bg-white min-h-[calc(100vh-80px)]`}>
      {/* 1. 꼭 사야 해요 영역 */}
      <section>
        <div className="flex items-center justify-between pb-1 mb-1">
          <h2 className="text-[18px] font-bold text-ink tracking-tight">
            꼭 사야 해요{' '}
            <span className="font-normal text-ink-muted text-[17px] ml-0.5">
              {urgentItems.length}
            </span>
          </h2>

          {/* 우측 상태 범례: ◌ 없음 */}
          <div className="flex items-center gap-1 text-[12px] text-ink-secondary font-normal select-none">
            <StatusSignal status="NONE" size={13} />
            <span>없음</span>
          </div>
        </div>

        {urgentItems.length === 0 ? (
          <div className="py-6 text-center text-ink-muted text-[14px]">
            꼭 사야 할 재료가 없어요.
          </div>
        ) : (
          <div className="flex flex-col">
            {urgentItems.map((item) => (
              <CartUrgentRow
                key={item.id}
                item={item}
                onToggleCheck={handleToggleCheck}
                onMarkInFridge={handleMarkInFridge}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. 더 사두면 좋아요 영역 */}
      <section>
        <div className="flex items-center justify-between pb-1 mb-1">
          <h2 className="text-[18px] font-bold text-ink tracking-tight">
            더 사두면 좋아요{' '}
            <span className="font-normal text-ink-muted text-[17px] ml-0.5">
              {extraItems.length}
            </span>
          </h2>

          {/* 우측 상태 범례: ◐ 적음  ◌ 없음 */}
          <div className="flex items-center gap-2.5 text-[12px] text-ink-secondary font-normal select-none">
            <span className="flex items-center gap-1">
              <StatusSignal status="LOW" size={13} />
              <span>적음</span>
            </span>
            <span className="flex items-center gap-1">
              <StatusSignal status="NONE" size={13} />
              <span>없음</span>
            </span>
          </div>
        </div>

        {extraItems.length === 0 ? (
          <div className="py-6 text-center text-ink-muted text-[14px]">
            냉장고에 부족한 재료가 없어요.
          </div>
        ) : (
          <div className="flex flex-col">
            {extraItems.map((item) => (
              <CartExtraRow
                key={item.id}
                item={item}
                onMoveToUrgent={handleMoveToUrgent}
              />
            ))}
          </div>
        )}
      </section>

      {isLoggedIn ? (
        <>
        {/* 3. 안내 문구 */}
        <div className="bg-fill rounded-[16px] p-4 text-[13px] text-ink-secondary leading-relaxed select-none">
          체크만으로는 냉장고가 바뀌지 않아요. 장을 본 뒤 아래 버튼을 눌러야 &apos;있음&apos;으로 등록됩니다.
        </div>

        {/* 4. 하단 고정 버튼: [체크한 n개 냉장고에 등록] */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[630px] p-4 bg-white/95 backdrop-blur-md border-t border-line-subtle z-40">
          <button
            type="button"
            onClick={handleRegisterChecked}
            disabled={checkedCount === 0 || isSubmitting}
            className="w-full h-[52px] bg-ink hover:bg-ink-hover disabled:bg-line-strong text-white rounded-btn text-[16px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center select-none shadow-xs"
          >
            {isSubmitting
              ? '냉장고에 등록 중...'
              : `체크한 ${checkedCount}개 냉장고에 등록`}
          </button>
        </div>
        </>
      ) : (
        /* 비로그인: 안내 문구·하단 고정 버튼 대신 로그인 안내 박스 (KD-49) */
        <LoginNoticeBox
          icon={<ShoppingCart className="w-8 h-8 text-ink-disabled" aria-hidden="true" />}
          title="장바구니를 쓰려면 로그인해 주세요."
          description="로그인하면 요리에 필요한 재료를 담고, 장 본 재료를 냉장고에 등록할 수 있어요."
          returnTo="/cart"
        />
      )}

      {/* 5. 토스트 알림 */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={Boolean(toastMessage)}
          onClose={() => setToastMessage(null)}
          duration={2500}
        />
      )}
    </div>
  );
};

export default CartPage;
