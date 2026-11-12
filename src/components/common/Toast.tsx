import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

/**
 * K-Doma 플로팅 토스트 컴포넌트
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 2400,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger" />;
      default:
        return <Info className="w-4 h-4 text-ink-muted" />;
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-[400px] px-5">
      <div className="bg-ink/95 backdrop-blur-sm text-white px-4 py-3 rounded-btn shadow-lg flex items-center justify-center gap-2.5 text-[14px] font-medium text-center">
        {renderIcon()}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
