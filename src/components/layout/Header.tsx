import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import useLoginGate from '../../hooks/useLoginGate';

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  cartCount?: number;
  rightAction?: React.ReactNode;
}

/**
 * K-Doma 상단 헤더 (모니모 스타일 카피)
 * - 기본형(탭 화면): 왼쪽 'K-DOMA' 굵은 볼드 워드마크 + 오른쪽 찜 아이콘(♡) · 장바구니 아이콘(코발트 블루 배지)
 *   찜 아이콘: 로그인이면 찜 화면으로 이동, 비로그인이면 로그인 유도 모달 → 로그인하면 찜 화면 (KD-55)
 * - 서브 화면: 뒤로가기 화살표 + 가운데 타이틀(17px 굵은 볼드) + 오른쪽 액션
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  cartCount = 0,
  rightAction,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requireLogin, loginModal } = useLoginGate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const isCartPage = location.pathname === '/cart';

  const openLikes = () =>
    requireLogin(() => navigate('/recipes/likes'), { description: '찜한 요리를 보려면 로그인해 주세요.' });

  return (
    <>
    <header className="sticky top-0 z-40 w-full h-[56px] bg-white/95 backdrop-blur-md px-5 flex items-center justify-between transition-colors border-b border-line-subtle/60">
      {/* 왼쪽 슬롯 */}
      <div className="flex items-center min-w-[44px]">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-ink hover:bg-line active:bg-line-strong transition-colors cursor-pointer"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[20px] font-black tracking-tight text-ink hover:text-primary transition-colors cursor-pointer"
          >
            K-DOMA
          </button>
        )}
      </div>

      {/* 가운데 슬롯 (하위 화면 제목) */}
      {title && (
        <div className="absolute left-1/2 -translate-x-1/2 max-w-[200px] truncate text-center">
          <h1 className="text-[17px] font-bold text-ink truncate">{title}</h1>
        </div>
      )}

      {/* 오른쪽 슬롯 (탭 화면: 찜 아이콘 + 장바구니 아이콘·코발트 블루 배지) */}
      <div className="flex items-center justify-end gap-1 min-w-[44px]">
        {!showBack && !rightAction && (
          <button
            type="button"
            onClick={openLikes}
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-line active:bg-line-strong transition-colors cursor-pointer"
            aria-label="찜한 요리 보기"
          >
            <Heart className="w-5 h-5 stroke-[2]" />
          </button>
        )}
        {rightAction ? (
          rightAction
        ) : !isCartPage ? (
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="relative w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-ink hover:bg-line active:bg-line-strong transition-colors cursor-pointer"
            aria-label="장바구니 이동"
          >
            <ShoppingBag className="w-5 h-5 stroke-[2]" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>
    </header>
    {/* 헤더(backdrop-blur) 밖에 둬야 모달이 화면 기준으로 뜬다 */}
    {loginModal}
    </>
  );
};

export default Header;
