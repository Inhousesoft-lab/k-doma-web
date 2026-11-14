/**
 * 날짜 유틸 (앱 기준 시간대: Asia/Seoul)
 * 날짜는 모두 'YYYY-MM-DD' 문자열로 다룬다. 계산은 UTC 자정 기준 Date로 해서
 * 기기 시간대와 상관없이 같은 결과가 나오게 한다.
 */

const APP_TIME_ZONE = 'Asia/Seoul';

/** 서비스 시작 달 (YYYY-MM-01). 달력 이동·기록 조회는 이 달보다 앞으로 가지 않는다 */
export const SERVICE_START_MONTH = '2026-08-01';

/** 오늘 날짜 (Asia/Seoul) */
export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function toUtcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtcDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function makeDateStr(year: number, monthIndex: number, day: number): string {
  return fromUtcDate(new Date(Date.UTC(year, monthIndex, day)));
}

export function addDays(dateStr: string, days: number): string {
  const date = toUtcDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtcDate(date);
}

/** 0 = 일요일 ... 6 = 토요일 */
export function dayOfWeek(dateStr: string): number {
  return toUtcDate(dateStr).getUTCDay();
}

/** 그 날짜가 속한 주의 일요일 (주 시작: 일요일) */
export function weekStartOf(dateStr: string): string {
  return addDays(dateStr, -dayOfWeek(dateStr));
}

/** b - a (일 단위) */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / 86_400_000);
}

export function parseDateStr(dateStr: string): { year: number; monthIndex: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, monthIndex: m - 1, day: d };
}

/** 연월 비교용 키 (예: 2026년 11월 → 202611). 큰 값이 나중 달 */
export function monthKey(dateStr: string): number {
  const { year, monthIndex } = parseDateStr(dateStr);
  return year * 100 + monthIndex + 1;
}

/** months 만큼 옮긴 달의 1일 (YYYY-MM-01). 연도가 바뀌어도 맞게 계산한다 */
export function addMonths(dateStr: string, months: number): string {
  const { year, monthIndex } = parseDateStr(dateStr);
  return makeDateStr(year, monthIndex + months, 1);
}

const WEEKDAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** 'YYYY-MM-DD' → '2026년 11월' */
export function formatYearMonth(dateStr: string): string {
  const { year, monthIndex } = parseDateStr(dateStr);
  return `${year}년 ${monthIndex + 1}월`;
}

/** 'YYYY-MM-DD' → '11월 12일 목요일' */
export function formatMonthDayWeekday(dateStr: string): string {
  const { monthIndex, day } = parseDateStr(dateStr);
  return `${monthIndex + 1}월 ${day}일 ${WEEKDAY_NAMES[dayOfWeek(dateStr)]}`;
}
