import React from 'react';
import { Loader2, Inbox, AlertTriangle, WifiOff } from 'lucide-react';
import Button from './Button';

export type StateViewType = 'loading' | 'empty' | 'error' | 'offline';

export interface StateViewProps {
  type: StateViewType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const DEFAULT_CONFIGS: Record<
  StateViewType,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionText?: string;
  }
> = {
  loading: {
    icon: <Loader2 className="w-8 h-8 text-primary animate-spin" />,
    title: '불러오는 중이에요',
    description: '잠시만 기다려주세요.',
  },
  empty: {
    icon: <Inbox className="w-8 h-8 text-ink-muted" />,
    title: '내용이 없어요',
    description: '새로운 요리나 재료를 추가해보세요.',
    actionText: '둘러보기',
  },
  error: {
    icon: <AlertTriangle className="w-8 h-8 text-warning" />,
    title: '문제가 발생했어요',
    description: '일시적인 오류가 발생했습니다. 다시 시도해주세요.',
    actionText: '다시 시도',
  },
  offline: {
    icon: <WifiOff className="w-8 h-8 text-ink-muted" />,
    title: '네트워크 연결을 확인해주세요',
    description: '인터넷 연결이 불안정합니다. 네트워크 상태를 확인해주세요.',
    actionText: '새로고침',
  },
};

/**
 * K-Doma 공통 상태 화면 (Loading / Empty / Error / Offline)
 * - 모든 화면에서 일관된 레이아웃 형태를 유지하며 문구/버튼만 props로 제어
 */
export const StateView: React.FC<StateViewProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  const defaults = DEFAULT_CONFIGS[type];
  const displayTitle = title ?? defaults.title;
  const displayDesc = description ?? defaults.description;
  const displayAction = actionText ?? defaults.actionText;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 min-h-[320px] ${className}`}
    >
      {/* 원형 아이콘 배경 */}
      <div className="w-16 h-16 rounded-full bg-line-subtle flex items-center justify-center mb-5 shrink-0">
        {defaults.icon}
      </div>

      {/* 텍스트 영역 */}
      <h3 className="text-[20px] font-bold text-ink mb-2">{displayTitle}</h3>
      <p className="text-[14px] text-ink-muted leading-relaxed max-w-[280px] mb-6 whitespace-pre-line">
        {displayDesc}
      </p>

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-[220px]">
        {displayAction && onAction && (
          <Button
            variant="primary"
            size="md"
            onClick={onAction}
            className="!h-[46px]"
          >
            {displayAction}
          </Button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <Button
            variant="secondary"
            size="md"
            onClick={onSecondaryAction}
            className="!h-[46px]"
          >
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StateView;
