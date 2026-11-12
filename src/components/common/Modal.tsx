import React, { useEffect } from 'react';
import Button from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

/**
 * K-Doma 다이얼로그 모달 컴포넌트
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  showCancel = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* 모달 창 */}
      <div className="relative w-full max-w-[340px] bg-white rounded-card shadow-2xl p-6 z-10 flex flex-col text-center">
        <h3 className="text-[19px] font-bold text-ink mb-2">{title}</h3>
        {description && (
          <p className="text-[14px] text-ink-secondary leading-relaxed mb-5 whitespace-pre-line">
            {description}
          </p>
        )}

        {children && <div className="mb-5 text-left">{children}</div>}

        <div className="flex gap-2.5 mt-2">
          {showCancel && (
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="flex-1 !h-[48px]"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className="flex-1 !h-[48px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
