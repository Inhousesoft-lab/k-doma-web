/**
 * 추천 정책 상수 (03-2 3.4·3.5·3.6, KD-50·KD-51)
 * v1 초기 정책값이다. 사용 이력에 따라 조정할 수 있다.
 */

/** 기본 점수 */
export const SCORE_BASE = 100;

/** 이력 감점: 가장 최근 COOKED 기록이 속한 주 하나만 (이번 주 / 전주 / 2주 전). 음식 묶음 단위 */
export const COOKED_PENALTY_BY_WEEKS_AGO = [-50, -30, -10];

/** 재료 보유 가점 최대값: 보유율 × 10 (0 ~ +10) */
export const STOCK_BONUS_MAX = 10;

/** 적음(LOW) 재료가 1개 이상이면 가점 (레시피당 1회) */
export const LOW_BONUS = 5;

/** Today 추천 요리 개수 (최대) */
export const TODAY_RECOMMEND_COUNT = 5;

/** Today 테마 개수와 테마당 요리 개수 (테마 카드는 2열 n행) */
export const THEME_COUNT = 1;
export const THEME_MAX_RECIPES = 10;

/** 테마 후보 (03-2 3.6). 요리가 0개인 테마만 뺀다 */
export const THEMES = [
  '파스타',
  '떡볶이',
  '국물',
  '긴급',
  '만원',
  '간식',
  '샌드위치',
  '수프',
  '양식',
  '중식',
  '일식',
  '분식',
  '해산물',
  '소',
  '돼지',
  '닭',
] as const;
