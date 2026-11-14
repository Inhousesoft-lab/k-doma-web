import React from 'react';
import { Calendar, GitCommitVertical } from 'lucide-react';

export type RecordsViewMode = 'calendar' | 'timeline';

export interface ViewToggleProps {
  value: RecordsViewMode;
  onChange: (mode: RecordsViewMode) => void;
}

const OPTIONS: { mode: RecordsViewMode; label: string; Icon: typeof Calendar }[] = [
  { mode: 'calendar', label: '달력', Icon: Calendar },
  { mode: 'timeline', label: '타임라인', Icon: GitCommitVertical },
];

/**
 * 기록 탭 보기 전환 토글 [달력 | 타임라인]
 * - 회색 알약 안에 버튼 2개. 선택된 쪽은 흰 바탕 + 그림자 + 굵은 글자
 * - 전체 높이 44px (누르는 영역)
 */
export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => (
  <div role="group" aria-label="보기 전환" className="flex gap-0.5 p-[3px] rounded-full bg-fill">
    {OPTIONS.map(({ mode, label, Icon }) => {
      const selected = value === mode;
      return (
        <button
          key={mode}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(mode)}
          className={`h-[38px] px-3 rounded-full flex items-center gap-1.5 text-[13px] transition-all cursor-pointer ${
            selected ? 'bg-white shadow-xs font-bold text-ink' : 'font-medium text-ink-tertiary hover:text-ink'
          }`}
        >
          <Icon className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
          {label}
        </button>
      );
    })}
  </div>
);

export default ViewToggle;
