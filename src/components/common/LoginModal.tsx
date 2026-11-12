import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, User } from 'lucide-react';
import BottomSheet from './BottomSheet';
import Button from './Button';
import { authService } from '../../services';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  redirectToLogin?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = '로그인이 필요해요',
  description = '장바구니에 담으려면 로그인해 주세요.\n가족과 함께 관리도 가능해요.',
  icon,
  redirectToLogin = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleStartLogin = () => {
    if (redirectToLogin) {
      // 전체 새로고침 없이 이동해야 메모리 데이터가 유지된다. 로그인 후 지금 화면으로 돌아온다.
      onClose();
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setShowLoginForm(true);
    setErrorMessage('');
  };

  const handleDoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await authService.login(username.trim(), password.trim());
      if (result.success) {
        onSuccess();
        onClose();
        setShowLoginForm(false);
      } else {
        setErrorMessage(result.message || '아이디 또는 비밀번호가 맞지 않아요');
      }
    } catch {
      setErrorMessage('아이디 또는 비밀번호가 맞지 않아요');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center px-1 pt-1 pb-4">
        {/* 아이콘 */}
        <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary mb-3">
          {icon || <ShoppingBag className="w-7 h-7 stroke-[2.2]" />}
        </div>

        {/* 안내 문구 */}
        <h3 className="text-[19px] font-black text-ink mb-1.5">
          {title}
        </h3>
        <p className="text-[14px] text-ink-secondary mb-6 leading-relaxed max-w-[280px] whitespace-pre-line">
          {description}
        </p>

        {!showLoginForm ? (
          <div className="w-full flex flex-col gap-2.5">
            <Button variant="primary" size="lg" onClick={handleStartLogin}>
              로그인하기
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose}>
              다음에 할게요
            </Button>
          </div>
        ) : (
          <form onSubmit={handleDoLogin} className="w-full flex flex-col gap-3 text-left">
            <div>
              <label className="block text-[12px] font-bold text-ink-secondary mb-1">
                아이디
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="이메일 주소 입력"
                  className="w-full h-[44px] pl-9 pr-3 rounded-[12px] bg-fill text-[14px] text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-ink-secondary mb-1">
                비밀번호
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full h-[44px] pl-9 pr-3 rounded-[12px] bg-fill text-[14px] text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
            </div>

            {/* 실패 오류 메시지 (기획서: '아이디 또는 비밀번호가 맞지 않아요') */}
            {errorMessage && (
              <p className="text-[13px] font-medium text-danger mt-1">
                {errorMessage}
              </p>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? '로그인 중...' : '로그인 완료'}
              </Button>
              <button
                type="button"
                onClick={() => setShowLoginForm(false)}
                className="text-[13px] text-ink-muted py-1 text-center hover:underline cursor-pointer"
              >
                뒤로
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};

export default LoginModal;
