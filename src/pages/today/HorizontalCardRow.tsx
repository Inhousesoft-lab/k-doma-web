import React from 'react';

export interface HorizontalCardRowProps {
  /** 드래그 중이었는지 알려 주는 함수를 받아 카드를 그린다 (드래그 직후 클릭 무시용) */
  children: (wasDragged: () => boolean) => React.ReactNode;
}

/**
 * 가로 스크롤 카드 줄. 마우스 드래그·터치 스크롤을 지원한다.
 * 줄마다 따로 동작한다 (추천 요리·테마마다 하나씩).
 */
export const HorizontalCardRow: React.FC<HorizontalCardRowProps> = ({ children }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [startX, setStartX] = React.useState<number>(0);
  const [scrollLeft, setScrollLeft] = React.useState<number>(0);
  const hasDraggedRef = React.useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    /* 좌우 스크롤 컨테이너: -mx-5 px-5 로 화면 가장자리까지 스크롤 + 마우스 드래그/터치 지원 */
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={() => setIsDragging(false)}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5 -mx-5 px-5 scroll-smooth touch-pan-x select-none cursor-grab active:cursor-grabbing"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children(() => hasDraggedRef.current)}
      {/* 끝 여백 보정용 더미 */}
      <div className="w-1 shrink-0" aria-hidden="true" />
    </div>
  );
};

export default HorizontalCardRow;
