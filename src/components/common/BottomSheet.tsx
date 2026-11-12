import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

/**
 * K-Doma 바텀시트 컴포넌트
 * - 아래에서 부드럽게 올라오는 모달 시트
 * - 최대 폭 630px 가운데 정렬
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* 시트 컨테이너 (최대 630px 유지) */}
      <div className="relative w-full max-w-[630px] bg-white rounded-t-sheet shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* 드래그 핸들 */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.2 bg-line-strong rounded-full" />
        </div>

        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-line-subtle">
            <h3 className="text-[17px] font-bold text-ink">{title || ''}</h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-line-subtle transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* 바디 컨텐츠 */}
        <div className="p-5 overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
