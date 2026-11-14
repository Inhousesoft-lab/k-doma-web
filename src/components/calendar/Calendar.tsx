import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { MealPlan } from '../../types';
import { addDays, addMonths, dayOfWeek, makeDateStr, monthKey, parseDateStr, todayStr, weekStartOf } from '../../utils/date';

export interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  plans: MealPlan[];
  todayDate?: string; // YYYY-MM-DD (기본: 오늘, Asia/Seoul)
}

/** 달력에서 볼 수 있는 가장 이른 달 (서비스 시작 달). 가장 늦은 달은 현재 월 */
export const CALENDAR_MIN_MONTH = '2026-08-01';

const WEEKDAYS = [
  { label: '일', isSunday: true, isSaturday: false },
  { label: '월', isSunday: false, isSaturday: false },
  { label: '화', isSunday: false, isSaturday: false },
  { label: '수', isSunday: false, isSaturday: false },
  { label: '목', isSunday: false, isSaturday: false },
  { label: '금', isSunday: false, isSaturday: false },
  { label: '토', isSunday: false, isSaturday: true },
];

interface DayCell {
  dateStr: string;
  dayNumber: number;
  dayOfWeek: number;
  inMonth: boolean; // 보고 있는 달의 날짜인지 (앞뒤 달 날짜는 흐리게)
}

function toCell(dateStr: string, monthIndex: number): DayCell {
  const parsed = parseDateStr(dateStr);
  return {
    dateStr,
    dayNumber: parsed.day,
    dayOfWeek: dayOfWeek(dateStr),
    inMonth: parsed.monthIndex === monthIndex,
  };
}

/** 한 주(일~토) 7일 */
function getWeekCells(dateStr: string, monthIndex: number): DayCell[] {
  const start = weekStartOf(dateStr);
  return Array.from({ length: 7 }, (_, i) => toCell(addDays(start, i), monthIndex));
}

/** 그 달을 덮는 주 전체 (앞뒤 달 날짜 포함) */
function getMonthCells(year: number, monthIndex: number): DayCell[] {
  const first = makeDateStr(year, monthIndex, 1);
  const last = makeDateStr(year, monthIndex + 1, 0);
  const cells: DayCell[] = [];
  for (let d = weekStartOf(first); d <= last; d = addDays(d, 7)) {
    cells.push(...getWeekCells(d, monthIndex));
  }
  return cells;
}

/**
 * 공용 달력 컴포넌트 (기록 탭용)
 * - 위쪽 줄: 연월('2026년 11월 ⌄') + 오른쪽 [오늘] 버튼
 * - 연월을 누르면 접힘(1주) ↔ 펼침(한 달)
 * - 요일 줄 일~토(일요일 시작). 일요일 빨강, 토요일 파랑
 * - 기본은 접힌 상태(선택한 날짜가 있는 주 1줄). 달력 아래 짧은 회색 손잡이
 * - 선택한 날짜: 검은 원(ink) 안에 흰 글자
 * - 오늘(선택 안 됨): 검은 테두리 원(ink), 안은 투명, 글자는 요일색 유지. 흐린 앞뒤 달 칸에는 표시 안 함
 * - 날짜 아래 점: ● 검은 원 = 요리 완료, ○ 테두리 원 = 요리 예정, 요리 없는 날은 점 없음
 * - 펼친 달력: 연월 양옆 ◀ ▶ 로 이전/다음 달. 2026년 8월 ~ 현재 월까지만 (끝이면 화살표 비활성)
 *   달을 옮기면 그 달 1일을 선택한다. 현재 월로 돌아오면 오늘을 선택한다
 * - 접힌 달력에는 화살표가 없다
 * - 흐린 앞뒤 달 날짜는 누를 수 없다 (달 이동은 화살표로만)
 */
export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  plans,
  todayDate = todayStr(),
}) => {
  // 접힌 달력(기본): true = 접힘(1주 7일), false = 펼침(한 달 전체)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  // 보고 있는 달 = 선택한 날짜의 달
  const { year, monthIndex } = parseDateStr(selectedDate);

  const getPlanDot = (dateStr: string) => {
    // 날짜마다 점 1개: 요리 완료가 1개라도 있으면 ●, 예정만 있으면 ○ (KD-57)
    const dayPlans = plans.filter((p) => p.date === dateStr);
    if (dayPlans.length === 0) return null;

    if (dayPlans.some((p) => p.status === 'COOKED')) {
      // ● 검은 원
      return (
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink inline-block"
          title="요리 완료"
          aria-label="요리 완료"
        />
      );
    }
    // ○ 테두리 원
    return (
      <span
        className="w-1.5 h-1.5 rounded-full border border-ink bg-white inline-block"
        title="요리 예정"
        aria-label="요리 예정"
      />
    );
  };

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleTodayClick = () => {
    onSelectDate(todayDate);
  };

  // 이전/다음 달: 2026년 8월 ~ 현재 월
  const viewKey = monthKey(selectedDate);
  const canGoPrev = viewKey > monthKey(CALENDAR_MIN_MONTH);
  const canGoNext = viewKey < monthKey(todayDate);

  const handleMoveMonth = (delta: -1 | 1) => {
    if (delta === -1 ? !canGoPrev : !canGoNext) return;
    const target = addMonths(selectedDate, delta);
    onSelectDate(monthKey(target) === monthKey(todayDate) ? todayDate : target);
  };

  const arrowClass =
    'w-11 h-11 flex items-center justify-center rounded-full text-ink hover:bg-fill transition-colors cursor-pointer disabled:text-ink-disabled disabled:hover:bg-transparent disabled:cursor-default';

  const cells = isCollapsed ? getWeekCells(selectedDate, monthIndex) : getMonthCells(year, monthIndex);

  return (
    <div className="bg-white px-1 pt-1 pb-2 select-none">
      {/* 1. 위쪽 줄: 연월 ('2026년 11월 ⌄') + 오른쪽 [오늘] 버튼 */}
      {/*    펼친 달력만 연월 양옆에 ◀ ▶ (버튼 영역 44px) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => handleMoveMonth(-1)}
              disabled={!canGoPrev}
              className={`${arrowClass} -ml-2.5`}
              aria-label="이전 달"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-1.5 text-[22px] font-black tracking-tight text-ink hover:text-primary transition-colors cursor-pointer"
            aria-expanded={!isCollapsed}
          >
            <span>{year}년 {monthIndex + 1}월</span>
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 text-ink stroke-[2.5]" />
            ) : (
              <ChevronUp className="w-5 h-5 text-ink stroke-[2.5]" />
            )}
          </button>
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => handleMoveMonth(1)}
              disabled={!canGoNext}
              className={arrowClass}
              aria-label="다음 달"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleTodayClick}
          className="h-[32px] px-3.5 rounded-full border border-line-strong hover:border-ink bg-white text-[13px] font-medium text-ink hover:bg-fill-subtle transition-all cursor-pointer shadow-2xs"
        >
          오늘
        </button>
      </div>

      {/* 2. 요일 줄: 일~토 (일요일 빨간색, 토요일 파란색, 월~금 다크) */}
      <div className="grid grid-cols-7 text-center mb-2">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd.label}
            className={`text-[13px] font-semibold py-0.5 ${
              wd.isSunday
                ? 'text-danger'
                : wd.isSaturday
                ? 'text-primary'
                : 'text-ink'
            }`}
          >
            {wd.label}
          </div>
        ))}
      </div>

      {/* 3. 날짜 그리드: 접힘 = 선택한 날짜가 있는 주 1줄, 펼침 = 한 달 (앞뒤 달 날짜는 흐리게, 누를 수 없음) */}
      <div className={`grid grid-cols-7 text-center ${isCollapsed ? '' : 'gap-y-2'}`}>
        {cells.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          const isToday = d.dateStr === todayDate && d.inMonth;
          const dayColor =
            d.dayOfWeek === 0 ? 'text-danger' : d.dayOfWeek === 6 ? 'text-primary' : 'text-ink';

          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onSelectDate(d.dateStr)}
              disabled={!d.inMonth}
              className={`flex flex-col items-center justify-center py-1 group ${
                d.inMonth ? 'cursor-pointer' : 'opacity-35 cursor-default'
              }`}
            >
              {/* 선택한 날짜: 검은 원(ink) 안에 흰 글자 / 오늘: 테두리 원(ink, 선택 원과 같은 색), 안은 투명 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold transition-all ${
                  isSelected
                    ? 'bg-ink text-white shadow-xs'
                    : `${dayColor} ${isToday ? 'border-2 border-ink' : ''} ${d.inMonth ? 'hover:bg-fill' : ''}`
                }`}
              >
                {d.dayNumber}
              </div>

              {/* 날짜 아래 점 (● 요리 완료 / ○ 요리 예정) */}
              <div className="h-2.5 flex items-center justify-center mt-1">{getPlanDot(d.dateStr)}</div>
            </button>
          );
        })}
      </div>

      {/* 4. 달력 아래 짧은 회색 손잡이 막대 */}
      <div
        onClick={handleToggle}
        className="pt-2 pb-1 flex justify-center cursor-pointer group"
        title={isCollapsed ? '달력 펼치기' : '달력 접기'}
        aria-label={isCollapsed ? '달력 펼치기' : '달력 접기'}
      >
        <div className="w-12 h-1 bg-line-strong group-hover:bg-ink-muted rounded-full transition-colors" />
      </div>
    </div>
  );
};

export default Calendar;
