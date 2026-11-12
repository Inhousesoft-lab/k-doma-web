import React from 'react';
import { ImageOff } from 'lucide-react';

export interface NoImageProps {
  /**
   * sm: 작은 썸네일(64px 등) — 글자만
   * md: 카드 사진 — 아이콘 + 글자
   * lg: 큰 사진(피드형·요리 상세) — 큰 아이콘 + 글자
   */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ICON_SIZE: Record<'md' | 'lg', string> = {
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

const TEXT_SIZE: Record<NonNullable<NoImageProps['size']>, string> = {
  sm: 'text-[11px]',
  md: 'text-[12px]',
  lg: 'text-[13px]',
};

/**
 * 요리 사진이 없을 때 사진 자리에 넣는 표시 (KD-45)
 * - 기본 사진은 쓰지 않는다. 부모 사진 자리를 그대로 채운다(같은 크기·같은 모서리)
 * - 옅은 점선 테두리, 아주 옅은 배경, 가운데 ImageOff + '이미지 없음' (sm 은 글자만)
 */
export const NoImage: React.FC<NoImageProps> = ({ size = 'md', className = '' }) => (
  <div
    className={`w-full h-full rounded-[inherit] border border-dashed border-line bg-fill-subtle flex flex-col items-center justify-center gap-1.5 text-ink-muted select-none ${className}`}
  >
    {size !== 'sm' && <ImageOff className={`${ICON_SIZE[size]} opacity-50`} aria-hidden="true" />}
    <span className={`${TEXT_SIZE[size]} font-medium leading-none`}>이미지 없음</span>
  </div>
);

export default NoImage;
