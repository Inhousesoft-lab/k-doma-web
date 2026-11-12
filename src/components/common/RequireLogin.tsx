import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services';

export interface RequireLoginProps {
  children: React.ReactNode;
}

/**
 * 로그인이 필요한 화면 보호 (찜·우리 집)
 * - 로그인하지 않았으면 Today('/')로 보낸다.
 * - 기록·장바구니·냉장고는 로그인 없이 열고 화면 안에서 안내한다 (KD-46·48·49)
 */
export const RequireLogin: React.FC<RequireLoginProps> = ({ children }) => {
  if (authService.isLoggedIn()) return <>{children}</>;
  return <Navigate to="/" replace />;
};

export default RequireLogin;
