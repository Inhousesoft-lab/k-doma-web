import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { authService } from '../services';

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser] = useState(authService.getCurrentUser());
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // 비로그인: 프로필·우리 집·로그아웃 대신 로그인 안내만 보여 준다
  if (!authService.isLoggedIn()) {
    return (
      <div className="flex flex-col px-5 pt-3 pb-6 gap-4">
        <section className="bg-white rounded-card p-5 shadow-card border border-line-subtle flex flex-col gap-4">
          <div>
            <h3 className="text-[20px] font-bold text-ink">로그인이 필요해요</h3>
            <p className="text-[13px] text-ink-muted mt-0.5">로그인하면 우리 집 냉장고와 요리 기록을 함께 관리할 수 있어요.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/login?returnTo=%2Fmy')}>
            로그인하기
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-3 pb-6 gap-4">
      {/* 1. 내 프로필 카드 (원형 이니셜 삭제, 닉네임만 표시, 메인/서브 역할 표시) */}
      <section className="bg-white rounded-card p-5 shadow-card border border-line-subtle">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[20px] font-bold text-ink">{currentUser.name}</h3>
              {currentUser.householdName && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-primary-light text-primary'
                      : 'bg-fill text-ink-tertiary'
                  }`}
                >
                  {currentUser.role === 'ADMIN' ? '메인' : '서브'}
                </span>
              )}
            </div>
            <p className="text-[13px] text-ink-muted mt-0.5">{currentUser.email ?? `@${currentUser.id}`}</p>
          </div>
        </div>
      </section>

      {/* 2. 가구 관리 메뉴 [우리 집] */}
      <section className="bg-white rounded-card overflow-hidden shadow-card border border-line-subtle">
        <button
          type="button"
          onClick={() => navigate('/my/home')}
          className="w-full p-4 flex items-center justify-between hover:bg-fill-subtle transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-bg flex items-center justify-center text-teal">
              <Home className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-ink">우리 집</h4>
              <p className="text-[12px] text-ink-muted">가구 구성원 {authService.getHouseholdMembers().length}명 관리</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-muted" />
        </button>
      </section>

      {/* 3. [로그아웃] 버튼 */}
      <div className="mt-4">
        <Button
          variant="secondary"
          icon={<LogOut className="w-4 h-4" />}
          onClick={() => setIsLogoutModalOpen(true)}
        >
          로그아웃
        </Button>
      </div>

      {/* 로그아웃 확인 모달 */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="로그아웃할까요?"
        description="로그아웃 시 로그인 화면으로 이동합니다."
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default MyPage;
