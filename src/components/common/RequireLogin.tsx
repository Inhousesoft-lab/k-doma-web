import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services';

export interface RequireLoginProps {
  children: React.ReactNode;
  /**
   * true: 앱 안에서 이동해 왔으면 화면을 그대로 보여 준다 (화면이 비로그인 안내 GuestView 를 갖고 있음).
   *       주소를 직접 열었을 때만 Today 로 보낸다. (기록·장바구니·냉장고)
   * false: 비로그인이면 항상 Today 로 보낸다. (찜·우리 집)
   */
  allowGuestView?: boolean;
}

/**
 * 로그인이 필요한 화면 보호
 * - 주소를 직접 열었는데(새로고침·주소창·외부 링크) 로그인하지 않았으면 Today('/')로 보낸다.
 * - '직접 열었는지'는 react-router 의 첫 진입 위치(location.key === 'default')로 판단한다.
 */
export const RequireLogin: React.FC<RequireLoginProps> = ({ children, allowGuestView = false }) => {
  const location = useLocation();

  if (authService.isLoggedIn()) return <>{children}</>;

  const openedDirectly = location.key === 'default';
  if (allowGuestView && !openedDirectly) return <>{children}</>;

  return <Navigate to="/" replace />;
};

export default RequireLogin;
