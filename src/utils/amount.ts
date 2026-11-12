/**
 * 재료 양을 인분에 맞게 바꾸는 유틸 (화면 표시만 바꾸고 원본 데이터는 그대로)
 *
 * 지원하는 표기
 * - 숫자 + 단위: '200g', '3큰술', '1.5큰술'
 * - 분수: '1/2모', '1/5큰술', '½개'(유니코드 분수)
 * - 대분수: '1 1/2컵', '1½컵'
 * - 앞에 말이 붙은 양: '듬뿍 3큰술', '약 200g'
 * 숫자가 없는 양('약간', '적당량')은 그대로 둔다.
 */

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅛': 1 / 8,
};
const UNICODE_CHARS = Object.keys(UNICODE_FRACTIONS).join('');

// 앞말 · 숫자(대분수/분수/소수/유니코드 분수) · 뒷말
const AMOUNT_PATTERN = new RegExp(
  `^(.*?)(\\d+\\s+\\d+\\/\\d+|\\d+[${UNICODE_CHARS}]|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|[${UNICODE_CHARS}])(.*)$`
);

function parseNumber(token: string): number {
  const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = token.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const last = token.slice(-1);
  if (UNICODE_FRACTIONS[last] !== undefined) {
    const whole = token.slice(0, -1);
    return (whole ? Number(whole) : 0) + UNICODE_FRACTIONS[last];
  }
  return Number(token);
}

/** 1/2, 1/3, 1/4, 1/5 등 흔한 분수는 분수로, 나머지는 소수 첫째 자리까지 */
export function formatNumber(value: number): string {
  const whole = Math.floor(value + 1e-9);
  const rest = value - whole;
  if (rest < 0.01) return String(whole);
  for (const den of [2, 3, 4, 5, 8]) {
    const num = Math.round(rest * den);
    if (num > 0 && num < den && Math.abs(rest - num / den) < 0.01) {
      // 약분이 되는 경우(2/4 등)는 더 작은 분모에서 이미 걸린다
      return whole > 0 ? `${whole} ${num}/${den}` : `${num}/${den}`;
    }
  }
  return String(Math.round(value * 10) / 10);
}

export function scaleAmount(amount: string | undefined, currentServings: number, baseServings: number = 2): string {
  if (!amount || amount === '-') return '-';
  if (currentServings === baseServings || baseServings <= 0) return amount;

  const match = amount.match(AMOUNT_PATTERN);
  if (!match) return amount; // '약간' 등

  const [, prefix, token, suffix] = match;
  const scaled = parseNumber(token) * (currentServings / baseServings);
  return `${prefix}${formatNumber(scaled)}${suffix}`;
}
