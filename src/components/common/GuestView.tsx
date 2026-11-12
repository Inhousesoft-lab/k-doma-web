import React, { useState } from 'react';
import StateView from './StateView';
import LoginModal from './LoginModal';

export interface GuestViewProps {
  /** 화면 가운데 안내 제목 (모달 제목도 같은 문구) */
  title: string;
  /** 화면 가운데 안내 설명 (모달 설명도 같은 문구) */
  description: string;
  /** 모달 아이콘 (없으면 LoginModal 기본 아이콘) */
  icon?: React.ReactNode;
  /** true면 [로그인하기]가 로그인 화면으로 이동, false면 모달 안에서 바로 로그인 */
  redirectToLogin?: boolean;
  /** 모달 안에서 로그인에 성공했을 때 */
  onLoggedIn: () => void;
}

/**
 * 비로그인 화면 (기록·장바구니·냉장고 공통)
 * - 가운데 안내 문구 + [로그인하기]
 * - 화면에 들어오면 로그인 유도 모달을 바로 띄운다 (KD-24)
 */
export const GuestView: React.FC<GuestViewProps> = ({
  title,
  description,
  icon,
  redirectToLogin = false,
  onLoggedIn,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] items-center justify-center px-5 py-10 bg-white">
      <StateView
        type="empty"
        title={title}
        description={description}
        actionText="로그인하기"
        onAction={() => setIsModalOpen(true)}
      />
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onLoggedIn}
        title={title}
        description={description}
        icon={icon}
        redirectToLogin={redirectToLogin}
      />
    </div>
  );
};

export default GuestView;
