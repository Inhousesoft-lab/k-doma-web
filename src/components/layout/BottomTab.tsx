import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Utensils, CalendarCheck2, Refrigerator, User } from 'lucide-react';

interface TabItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { to: '/', label: 'Today', icon: Sparkles },
  { to: '/recipes', label: '요리', icon: Utensils },
  { to: '/records', label: '기록', icon: CalendarCheck2 },
  { to: '/fridge', label: '냉장고', icon: Refrigerator },
  { to: '/my', label: '마이', icon: User },
];

/**
 * K-Doma 하단 탭바 (모니모 스타일 카피)
 * - 5개 탭: Today / 요리 / 기록 / 냉장고 / 마이 (순서 고정)
 * - 모니모 특유의 스타일: 활성 탭은 선명한 코발트 블루(primary) 아이콘과 볼드 라벨, 비활성은 소프트 그레이(ink-disabled)
 */
export const BottomTab: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[630px] h-[64px] bg-white border-t border-line-subtle shadow-nav z-40 flex items-center justify-around px-2 select-none"
      aria-label="하단 네비게이션"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary'
                  : 'text-ink-disabled hover:text-ink-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center w-6 h-6 mb-1">
                  <Icon
                    className={`w-[22px] h-[22px] transition-transform ${
                      isActive ? 'stroke-[2.5] text-primary' : 'stroke-[1.8] text-ink-disabled'
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] tracking-tight leading-none ${
                    isActive ? 'font-bold text-primary' : 'font-medium text-ink-disabled'
                  }`}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomTab;
