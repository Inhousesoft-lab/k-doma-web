import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MealPlan } from '../../types';
import { formatMonthDayWeekday, formatYearMonth, monthKey } from '../../utils/date';

export interface RecordsTimelineProps {
  /** 요리 완료 기록만 (getPlans 순서: 날짜순, 같은 날은 추가한 순) */
  plans: MealPlan[];
  /** 카드 그리기. 달력 보기와 같은 PlanCard 를 그대로 쓴다 */
  renderCard: (plan: MealPlan) => React.ReactNode;
  /** 날짜 줄 누름 → 달력 보기로 바꾸고 그 날짜 선택 */
  onSelectDate: (date: string) => void;
}

interface DayGroup {
  date: string;
  plans: MealPlan[];
}

/** 날짜별로 묶고 최신 날짜가 위로. 같은 날 안의 순서(추가한 순)는 그대로 둔다 */
export function groupByDateDesc(plans: MealPlan[]): DayGroup[] {
  const byDate = new Map<string, MealPlan[]>();
  for (const plan of plans) {
    const list = byDate.get(plan.date);
    if (list) list.push(plan);
    else byDate.set(plan.date, [plan]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, dayPlans]) => ({ date, plans: dayPlans }));
}

/**
 * 기록 탭 타임라인 보기
 * - 요리 완료한 날만, 최신 날짜가 위
 * - 달이 바뀌면 월 제목 ('2026년 11월')
 * - 왼쪽 세로선 + 날짜마다 동그라미, 오른쪽에 날짜 줄과 그 날의 요리 카드
 * - 나중에 리팩토링 필요: 기록이 아주 많아지면 나눠 그리기(가상 스크롤/페이지)
 */
export const RecordsTimeline: React.FC<RecordsTimelineProps> = ({ plans, renderCard, onSelectDate }) => {
  const groups = groupByDateDesc(plans);

  return (
    <section aria-label="요리 타임라인" className="flex flex-col">
      {groups.map((group, i) => {
        const isNewMonth = i === 0 || monthKey(groups[i - 1].date) !== monthKey(group.date);
        return (
          <React.Fragment key={group.date}>
            {isNewMonth && (
              <h2 className={`text-[22px] font-black tracking-tight text-ink mb-3 ${i === 0 ? '' : 'mt-1'}`}>
                {formatYearMonth(group.date)}
              </h2>
            )}
            <div className="flex gap-3">
              {/* 왼쪽: 동그라미 + 세로선 */}
              <div className="w-6 shrink-0 flex flex-col items-center" aria-hidden="true">
                <span className="w-6 h-6 rounded-full border-2 border-ink bg-white flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-ink" />
                </span>
                <span className="w-0.5 grow bg-line" />
              </div>

              {/* 오른쪽: 날짜 줄 + 카드 */}
              <div className="flex-1 min-w-0 flex flex-col gap-2.5 pb-6">
                <button
                  type="button"
                  onClick={() => onSelectDate(group.date)}
                  className="self-start h-11 -my-2.5 flex items-center gap-1 text-[15px] font-bold text-ink hover:text-primary transition-colors cursor-pointer"
                >
                  {formatMonthDayWeekday(group.date)}
                  <ChevronRight className="w-3.5 h-3.5 text-ink-muted stroke-[2.5]" aria-hidden="true" />
                </button>
                {group.plans.map((plan) => (
                  <React.Fragment key={plan.id}>{renderCard(plan)}</React.Fragment>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </section>
  );
};

export default RecordsTimeline;
