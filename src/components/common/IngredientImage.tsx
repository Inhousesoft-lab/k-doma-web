import React, { useState } from 'react';
import { findMasterIngredient } from '../../utils/ingredient';

/** 재료 아이콘 파일 위치. public/images/ingredients/{imageKey}.webp (원본 PNG: assets/ingredients-src, 변환: scripts/build-ingredient-images.py) */
export const INGREDIENT_IMAGE_DIR = '/images/ingredients';

/** imageKey 가 없으면(예전에 저장된 냉장고 재료) 재료 사전에서 이름으로 찾는다 */
export function ingredientImageSrc(name: string, imageKey?: string | null): string | null {
  const key = imageKey ?? findMasterIngredient(name)?.imageKey ?? null;
  return key ? `${INGREDIENT_IMAGE_DIR}/${key}.webp` : null;
}

export interface IngredientImageProps {
  name: string;
  imageKey?: string | null;
  /** 바깥 상자 크기·모서리 (예: 'w-12 h-12 rounded-[10px]') */
  className?: string;
  /** 이미지 파일이 없을 때 보여줄 글자 */
  placeholder?: string;
  /** 자리표시 글자 크기 */
  placeholderClassName?: string;
}

/**
 * 재료 아이콘 (AI 생성 이미지)
 * - 파일이 없거나 불러오지 못하면 기존 자리표시(bg-thumb + 글자)를 그대로 보여준다
 * - 흰 배경 이미지라 mix-blend-multiply 로 타일 배경색에 자연스럽게 섞는다
 */
export const IngredientImage: React.FC<IngredientImageProps> = ({
  name,
  imageKey,
  className = '',
  placeholder = 'AI 이미지',
  placeholderClassName = 'text-[10px] font-medium',
}) => {
  const src = ingredientImageSrc(name, imageKey);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && failedSrc !== src;

  return (
    <div
      className={`flex items-center justify-center shrink-0 overflow-hidden leading-none select-none ${
        showImage ? '' : `bg-thumb text-ink-muted ${placeholderClassName}`
      } ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          draggable={false}
          onError={() => setFailedSrc(src)}
          className="w-full h-full object-contain mix-blend-multiply"
        />
      ) : (
        placeholder
      )}
    </div>
  );
};

export default IngredientImage;
