import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

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
    <div className="flex flex-col items-center text-center gap-2 px-5 py-9 rounded-card border border-line bg-fill-subtle">
      {icon}
      <h3 className="mt-1 text-[15px] font-bold text-ink">{title}</h3>
      <p className="text-[13px] text-ink-muted leading-relaxed">{description}</p>
      <Button
        variant="primary"
        size="md"
        fullWidth={false}
        className="mt-3"
        onClick={() => navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)}
      >
        로그인하기
      </Button>
    </div>
  );
};

export default LoginNoticeBox;
