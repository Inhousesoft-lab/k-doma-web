import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ingredient, StorageZone } from '../../types';

/**
 * 냉장고 아이콘형 타일을 끌어서 다른 구역(양념 선반 ↔ 냉장고)으로 옮기는 훅
 * - 마우스: 누른 채 6px 넘게 움직이면 끌기 시작
 * - 터치: 350ms 길게 누르면 끌기 시작 (그 전에 움직이면 평소처럼 화면 스크롤)
 * - 놓은 자리의 구역은 data-drop-zone 속성으로 찾는다
 * - 끌기가 끝난 직후 생기는 클릭(상태 순환)은 무시한다
 * - 화면 위·아래 끝으로 끌면 자동으로 스크롤한다
 */

const LONG_PRESS_MS = 350;
const MOUSE_THRESHOLD = 6;
const TOUCH_SLOP = 8;
const EDGE_TOP = 80;
const EDGE_BOTTOM = 110; // 하단 탭 높이 포함
const SCROLL_STEP = 10;

export interface ZoneDragState {
  ingredient: Ingredient;
  x: number;
  y: number;
  overZone: StorageZone | null;
}

interface PendingPress {
  ingredient: Ingredient;
  pointerType: string;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  timer?: number;
}

const zoneAt = (x: number, y: number): StorageZone | null => {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-zone]');
  return (el?.dataset.dropZone as StorageZone | undefined) ?? null;
};

export function useZoneDrag(onDrop: (ingredient: Ingredient, zone: StorageZone) => void) {
  const [drag, setDrag] = useState<ZoneDragState | null>(null);
  const dragRef = useRef<ZoneDragState | null>(null);
  const pendingRef = useRef<PendingPress | null>(null);
  const suppressClickRef = useRef(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const update = (next: ZoneDragState | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const clearPending = () => {
    if (pendingRef.current?.timer) window.clearTimeout(pendingRef.current.timer);
    pendingRef.current = null;
  };

  const beginDrag = () => {
    const p = pendingRef.current;
    if (!p) return;
    clearPending();
    update({ ingredient: p.ingredient, x: p.lastX, y: p.lastY, overZone: zoneAt(p.lastX, p.lastY) });
    navigator.vibrate?.(15);
  };

  /** 타일의 onPointerDown 에 연결 */
  const startPress = useCallback((e: React.PointerEvent, ingredient: Ingredient) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    clearPending();
    const p: PendingPress = {
      ingredient,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    if (e.pointerType !== 'mouse') p.timer = window.setTimeout(beginDrag, LONG_PRESS_MS);
    pendingRef.current = p;
  }, []);

  /** 끌기 직후의 클릭이면 true (그 클릭은 무시해야 한다) */
  const consumeClick = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (current) {
        update({ ...current, x: e.clientX, y: e.clientY, overZone: zoneAt(e.clientX, e.clientY) });
        return;
      }
      const p = pendingRef.current;
      if (!p) return;
      p.lastX = e.clientX;
      p.lastY = e.clientY;
      const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
      if (p.pointerType === 'mouse') {
        if (dist > MOUSE_THRESHOLD) beginDrag();
      } else if (dist > TOUCH_SLOP) {
        clearPending(); // 길게 누르기 전에 움직였다 → 스크롤
      }
    };

    const onUp = () => {
      clearPending();
      const current = dragRef.current;
      if (!current) return;
      update(null);
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 300);
      if (current.overZone && current.overZone !== current.ingredient.zone) {
        onDropRef.current(current.ingredient, current.overZone);
      }
    };

    const onCancel = () => {
      clearPending();
      if (dragRef.current) update(null);
    };

    // 끄는 중에는 터치 스크롤을 막는다 (passive: false 여야 막힌다)
    const onTouchMove = (e: TouchEvent) => {
      if (dragRef.current) e.preventDefault();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('touchmove', onTouchMove);
      clearPending();
    };
  }, []);

  // 화면 끝 근처로 끌면 자동 스크롤
  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) return;
    let frame = 0;
    const tick = () => {
      const current = dragRef.current;
      if (current) {
        let dy = 0;
        if (current.y < EDGE_TOP) dy = -SCROLL_STEP;
        else if (current.y > window.innerHeight - EDGE_BOTTOM) dy = SCROLL_STEP;
        if (dy !== 0) {
          window.scrollBy(0, dy);
          const overZone = zoneAt(current.x, current.y);
          if (overZone !== current.overZone) update({ ...current, overZone });
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isDragging]);

  return { drag, startPress, consumeClick };
}

export default useZoneDrag;
