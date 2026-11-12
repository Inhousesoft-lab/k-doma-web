import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import Button from '../components/common/Button';
import { authService } from '../services';

/** 앱 안쪽 경로만 돌아갈 곳으로 허용 */
const safeReturnTo = (value: string | null): string =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login') ? value : '/';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await authService.login(username.trim(), password);
      if (result.success) {
        navigate(returnTo, { replace: true });
      } else {
        setErrorMessage(result.message || '아이디 또는 비밀번호가 맞지 않아요');
      }
    } catch {
      setErrorMessage('아이디 또는 비밀번호가 맞지 않아요');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (userId: string) => {
    setUsername(userId);
    authService.setCurrentUser(userId);
    navigate(returnTo, { replace: true });
  };

  return (
    <div className="flex flex-col px-5 pt-8 pb-10 min-h-[75vh] justify-between">
      <div>
        {/* 서비스 타이틀 */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-card bg-primary text-white flex items-center justify-center text-[26px] font-black mx-auto mb-4 shadow-md">
            K
          </div>
          <h2 className="text-[24px] font-bold text-ink tracking-tight">
            K-DOMA 로그인
          </h2>
          <p className="text-[14px] text-ink-muted mt-1">
            우리 집 냉장고와 집밥 식단을 확인하세요
          </p>
        </div>

        {/* 폼 입력창 */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[13px] font-medium text-ink-secondary mb-1.5">
              아이디
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-5 h-5 text-ink-muted" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full h-[50px] bg-white rounded-btn border border-line pl-11 pr-4 text-[15px] text-ink outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-secondary mb-1.5">
              비밀번호
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-5 h-5 text-ink-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full h-[50px] bg-white rounded-btn border border-line pl-11 pr-4 text-[15px] text-ink outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-[13px] font-medium text-danger">{errorMessage}</p>
          )}

          <div className="pt-3">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>

        {/* 개발 모드에서만: 테스트 계정 빠른 선택 (데모·배포 빌드에는 안 보임) */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-white rounded-[16px] border border-line">
            <p className="text-[12px] font-bold text-ink-muted mb-2 uppercase tracking-wide">
              빠른 테스트 계정 선택
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('taering')}
                className="p-2.5 rounded-[12px] bg-primary-light text-primary text-[13px] font-semibold text-center hover:bg-primary-light-hover transition-colors cursor-pointer"
              >
                이태링 (메인)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('beomi')}
                className="p-2.5 rounded-[12px] bg-line-subtle text-ink-secondary text-[13px] font-semibold text-center hover:bg-line transition-colors cursor-pointer"
              >
                김버미 (서브)
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[12px] text-ink-muted">
        K-Doma Phase 1 Wireframe
      </p>
    </div>
  );
};

export default LoginPage;
