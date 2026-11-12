import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'mint' | 'periwinkle' | 'peach' | 'lavender' | 'sky';
  interactive?: boolean;
}

/**
 * K-Doma 공통 카드 컴포넌트 (모니모 스타일 카피)
 * - default: 순백색(white), 모서리 20px, 아주 은은한 확산 그림자
 * - mint: 모니모 소프트 세이지 민트(mint-bg)
 * - periwinkle: 모니모 비비드 블루 카드(periwinkle, 화이트 텍스트)
 * - peach: 모니모 소프트 살구 피치(peach-bg)
 * - lavender: 모니모 소프트 연보라(lavender-bg)
 * - sky: 모니모 소프트 스카이(sky-bg)
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  interactive = false,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-white text-ink shadow-card border border-line-subtle/80',
    subtle:
      'bg-fill-subtle text-ink border border-line',
    mint:
      'bg-mint-bg text-mint border border-mint-line/60',
    periwinkle:
      'bg-periwinkle text-white shadow-highlight',
    peach:
      'bg-peach-bg text-peach border border-peach-line/60',
    lavender:
      'bg-lavender-bg text-lavender border border-lavender-line/60',
    sky:
      'bg-sky-bg text-primary border border-sky-line/60',
  }[variant];

  const interactiveStyles = interactive || onClick
    ? 'cursor-pointer active:scale-[0.99] transition-transform'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-card p-5 ${variantStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
