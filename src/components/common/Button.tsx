import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

/**
 * K-Doma 공통 버튼 컴포넌트 (모니모 스타일 카피)
 * - Primary: 모니모 시그니처 코발트 블루(primary), 높이 52px, 모서리 14px, 화이트 볼드
 * - Secondary: 모니모 특유의 소프트 블루 배경(primary-light), 블루 텍스트(primary)
 * - Neutral: 옅은 그레이 배경(fill), 차콜 텍스트(ink-secondary)
 * - Text: 투명 배경의 링크형
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-[38px] px-3.5 text-[13px] rounded-[10px]',
    md: 'h-[44px] px-4 text-[14px] rounded-[12px]',
    lg: 'h-[52px] px-5 text-[16px] rounded-btn',
  }[size];

  const variantClasses = {
    primary:
      'bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold shadow-xs',
    secondary:
      'bg-primary-light hover:bg-primary-light-hover active:bg-primary-light-active text-primary font-bold',
    neutral:
      'bg-fill hover:bg-line active:bg-line-strong text-ink-secondary font-semibold',
    text:
      'bg-transparent hover:bg-primary-light/50 text-ink-secondary hover:text-primary font-medium h-auto py-2 px-3',
  }[variant];

  const widthClass = fullWidth ? 'w-full' : 'w-auto inline-flex';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      className={`flex items-center justify-center gap-2 select-none transition-colors duration-150 ${sizeClasses} ${variantClasses} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;
