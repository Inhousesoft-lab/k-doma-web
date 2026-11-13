import React from 'react';
import { IngredientStatus } from '../../types';

export interface StatusSignalProps {
  status: IngredientStatus;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export const STATUS_LABELS: Record<IngredientStatus, string> = {
  HAVE: '있음',
  LOW: '적음',
  NONE: '없음',
};

/** 디자인 토큰(src/index.css @theme) 색을 CSS 변수로 쓴다 */
export const STATUS_COLORS: Record<IngredientStatus, string> = {
  HAVE: 'var(--color-have)',
  LOW: 'var(--color-warning)',
  NONE: 'var(--color-ink-muted)',
};

/**
 * 재료 상태 신호 컴포넌트
 * - 모양으로 상태 구분 (흑백/색약 대응 필수 규칙):
 *   - 있음 (HAVE): ● 꽉 찬 원
 *   - 적음 (LOW): ◐ 반만 찬 원 (왼쪽 반원 채움)
 *   - 없음 (NONE): ◌ 점선 원
 * - '조금' 사용 금지 -> '적음'으로 통일
 * - 개수 표기 없음
 */
export const StatusSignal: React.FC<StatusSignalProps> = ({
  status,
  size = 14,
  showLabel = false,
  className = '',
}) => {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  // 반경 및 중심좌표
  const r = (size - 2) / 2;
  const c = size / 2;

  const renderShape = () => {
    switch (status) {
      case 'HAVE':
        // ● 꽉 찬 원
        return <circle cx={c} cy={c} r={r} fill={color} />;

      case 'LOW':
        // ◐ 반만 찬 원 (외곽 원선 + 왼쪽 반원 채움)
        return (
          <g>
            {/* 외곽선 */}
            <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="1.5" />
            {/* 왼쪽 반원 채움: c, c-r 에서 시작하여 아래로 호를 그리고 위로 직선 */}
            <path
              d={`M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`}
              fill={color}
            />
          </g>
        );

      case 'NONE':
        // ◌ 점선 원 (비어 있고 점선 테두리)
        return (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="2.5 2.5"
          />
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 align-middle select-none ${className}`}
      title={`상태: ${label}`}
      role="status"
      aria-label={`상태: ${label}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 overflow-visible"
        aria-hidden="true"
      >
        {renderShape()}
      </svg>
      {showLabel && (
        <span
          className={`text-[13px] font-medium ${status === 'NONE' ? 'text-ink-muted' : 'text-ink-secondary'}`}
        >
          {label}
        </span>
      )}
    </span>
  );
};

export default StatusSignal;
