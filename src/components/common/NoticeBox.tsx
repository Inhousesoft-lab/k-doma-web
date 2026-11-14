import React from 'react';
import Button from './Button';

export interface NoticeBoxProps {
  /** 흐린 색 아이콘 (예: <Calendar className="w-8 h-8 text-ink-disabled" aria-hidden="true" />) */
  icon: React.ReactNode;
  title: string;
  description: string;
  /** 버튼 문구. actionText 와 onAction 이 둘 다 있을 때만 버튼을 그린다 */
  actionText?: string;
  onAction?: () => void;
}

/**
 * 안내 박스 (옅은 회색 박스 + 아이콘 + 제목 + 설명 + 버튼(선택))
 * - 로그인 안내(LoginNoticeBox), 기록 없는 날 안내(기록 탭 달력 보기)에서 같이 쓴다
 */
export const NoticeBox: React.FC<NoticeBoxProps> = ({ icon, title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center text-center gap-2 px-5 py-9 rounded-card border border-line bg-fill-subtle">
    {icon}
    <h3 className="mt-1 text-[15px] font-bold text-ink">{title}</h3>
    <p className="text-[13px] text-ink-muted leading-relaxed whitespace-pre-line">{description}</p>
    {actionText && onAction && (
      <Button variant="primary" size="md" fullWidth={false} className="mt-3" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);

export default NoticeBox;
