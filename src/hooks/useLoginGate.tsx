import { useState } from 'react';
import LoginModal from '../components/common/LoginModal';
import { authService } from '../services';

type Action = () => void | Promise<void>;

export interface LoginGateOptions {
  /** 로그인 성공 직후 실행할 동작. 없으면 action 을 그대로 실행 */
  afterLogin?: Action;
  /** 모달 설명 문구 */
  description?: string;
}

interface PendingAction {
  afterLogin: Action;
  description?: string;
}

/**
 * 로그인이 필요한 동작(찜, 장바구니, 오늘 기록 등)을 감싸는 훅
 * - 로그인 상태면 action 을 바로 실행한다.
 * - 비로그인이면 로그인 유도 모달을 띄우고, 모달에서 로그인하면 afterLogin(없으면 action)을 이어서 실행한다.
 *   (예: 찜 '켜기'는 토글이 아니라 '켜기'로 실행해야, 이미 찜한 요리를 로그인 직후 꺼 버리지 않는다)
 *
 * 사용: const { requireLogin, loginModal } = useLoginGate();
 *       requireLogin(() => ..., { afterLogin: () => ..., description: '찜하려면 로그인해 주세요.' })
 *       화면 JSX 안에 {loginModal} 을 한 번 넣는다.
 */
export function useLoginGate() {
  const [pending, setPending] = useState<PendingAction | null>(null);

  const requireLogin = (action: Action, options: LoginGateOptions = {}) => {
    if (authService.isLoggedIn()) {
      return action();
    }
    setPending({ afterLogin: options.afterLogin ?? action, description: options.description });
  };

  const handleSuccess = async () => {
    const next = pending;
    setPending(null);
    await next?.afterLogin();
  };

  const loginModal = (
    <LoginModal
      isOpen={pending !== null}
      onClose={() => setPending(null)}
      onSuccess={handleSuccess}
      title="로그인이 필요해요"
      description={pending?.description}
    />
  );

  return { requireLogin, loginModal };
}

export default useLoginGate;
