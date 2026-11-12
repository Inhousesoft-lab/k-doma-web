import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomTab from './BottomTab';
import { authService, cartService, subscribeToDataChanges } from '../../services';

export interface AppShellProps {
  children: React.ReactNode;
}

const TAB_ROUTES = ['/', '/recipes', '/records', '/fridge', '/my'];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const [cartCount, setCartCount] = useState<number>(0);

  // 장바구니를 담거나 빼면 바로 배지에 반영한다. 비로그인은 0 (KD-27: 장바구니는 계정별)
  useEffect(() => {
    const refresh = () => {
      if (!authService.isLoggedIn()) {
        setCartCount(0);
        return;
      }
      cartService.getCartCount().then(setCartCount).catch(() => setCartCount(0));
    };
    refresh();
    return subscribeToDataChanges(refresh);
  }, []);

  const isTabRoute = TAB_ROUTES.includes(location.pathname);

  const getHeaderConfig = () => {
    const path = location.pathname;

    if (path === '/') return { showBack: false };
    if (path === '/recipes') return { showBack: false };
    if (path === '/records') return { showBack: false };
    if (path === '/fridge') return { showBack: false };
    if (path === '/my') return { showBack: false };
    if (path === '/recipes/likes') return { showBack: true, title: '찜' };
    if (path.startsWith('/recipe/')) return { showBack: true, title: '요리 상세' };
    if (path === '/cart') return { showBack: true, title: '장바구니' };
    if (path === '/my/home') return { showBack: true, title: '우리 집' };
    if (path === '/login') return { showBack: true, title: '로그인' };

    return { showBack: true };
  };

  const headerConfig = getHeaderConfig();

  return (
    <div className="min-h-screen w-full bg-canvas flex justify-center selection:bg-primary/20">
      {/* 모든 화면 배경: 순백색 (white) */}
      <div className="w-full max-w-[630px] min-w-[360px] min-h-screen bg-white relative flex flex-col shadow-sm">
        <Header
          showBack={headerConfig.showBack}
          title={headerConfig.title}
          cartCount={cartCount}
        />

        <main className={`flex-1 flex flex-col ${isTabRoute ? 'pb-[76px]' : 'pb-8'}`}>
          {children}
        </main>

        {isTabRoute && <BottomTab />}
      </div>
    </div>
  );
};

export default AppShell;
