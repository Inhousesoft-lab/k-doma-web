import React from 'react';
import { Loader2 } from 'lucide-react';
import { MealPlan } from '../../types';
import Button from '../common/Button';
import { formatMonthDayWeekday, formatYearMonth, monthKey } from '../../utils/date';

export interface RecordsTimelineProps {
  /** 요리 완료 기록만 (getPlans 순서: 날짜순, 같은 날은 추가한 순) */
  plans: MealPlan[];
  /** 카드 그리기. 달력 보기와 같은 PlanCard 를 그대로 쓴다 */
  renderCard: (plan: MealPlan) => React.ReactNode;
  /** 아래 [더 보기] 문구 ('10월 기록 더 보기'). null 이면 더 받을 달이 없어 버튼을 숨긴다 */
  loadMoreLabel: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
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
 * - 왼쪽 세로선 + 날짜마다 동그라미, 오른쪽에 날짜(글자만, 누를 수 없음)와 그 날의 요리 카드
 * - 받은 범위(지난달 1일~)만 그린다. 이전 달은 아래 [N월 기록 더 보기]로 한 달씩 더 받는다
 */
export const RecordsTimeline: React.FC<RecordsTimelineProps> = ({ plans, renderCard, loadMoreLabel, loadingMore, onLoadMore }) => {
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
                <h3 className="h-6 flex items-center text-[15px] font-bold text-ink">
                  {formatMonthDayWeekday(group.date)}
                </h3>
                {group.plans.map((plan) => (
                  <React.Fragment key={plan.id}>{renderCard(plan)}</React.Fragment>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {loadMoreLabel && (
        <Button
          variant="neutral"
          size="md"
          onClick={onLoadMore}
          disabled={loadingMore}
          icon={loadingMore ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : undefined}
        >
          {loadingMore ? '불러오는 중이에요' : loadMoreLabel}
        </Button>
      )}
    </section>
  );
};

export default RecordsTimeline;
