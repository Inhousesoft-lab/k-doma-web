import React from 'react';
import { useNavigate } from 'react-router-dom';
import NoticeBox from './NoticeBox';

export interface LoginNoticeBoxProps {
  /** 흐린 색 아이콘 (예: <Calendar className="w-8 h-8 text-ink-disabled" aria-hidden="true" />) */
  icon: React.ReactNode;
  title: string;
  description: string;
  /** 로그인한 뒤 돌아올 주소 (예: '/records') */
  returnTo: string;
}

/**
 * 비로그인 로그인 안내 박스 (기록 KD-48 · 장바구니 KD-49 공통)
 * - 화면은 그대로 열고, 로그인이 필요한 내용 자리에 이 박스를 보여 준다
 * - [로그인하기] → 로그인 화면. 로그인하면 returnTo 로 돌아온다
 */
export const LoginNoticeBox: React.FC<LoginNoticeBoxProps> = ({ icon, title, description, returnTo }) => {
  const navigate = useNavigate();

  return (
    <NoticeBox
      icon={icon}
      title={title}
      description={description}
      actionText="로그인하기"
      onAction={() => navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)}
    />
  );
};

export default LoginNoticeBox;
