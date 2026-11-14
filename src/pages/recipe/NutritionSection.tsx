import React from 'react';
import { RecipeNutrition } from '../../types';

/** 요리 상세 영양성분 4칸 (영양 데이터가 있는 요리만 그린다) */
const NutritionSection: React.FC<{ nutrition: RecipeNutrition }> = ({ nutrition }) => (
  <section className="bg-white rounded-card p-4.5 border border-line">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[16px] font-bold text-ink">영양성분</h3>
      <span className="text-[12px] text-ink-muted">
        1인분 · 재료 분석 추정치
      </span>
    </div>

    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-fill rounded-[12px] py-2 px-1">
        <span className="block text-[11px] text-ink-muted font-medium">칼로리</span>
        <span className="block text-[14px] font-bold text-ink mt-0.5">
          {nutrition.calories}kcal
        </span>
      </div>
      <div className="bg-fill rounded-[12px] py-2 px-1">
        <span className="block text-[11px] text-ink-muted font-medium">탄수화물</span>
        <span className="block text-[14px] font-bold text-ink mt-0.5">
          {nutrition.carbs}g
        </span>
      </div>
      <div className="bg-fill rounded-[12px] py-2 px-1">
        <span className="block text-[11px] text-ink-muted font-medium">단백질</span>
        <span className="block text-[14px] font-bold text-ink mt-0.5">
          {nutrition.protein}g
        </span>
      </div>
      <div className="bg-fill rounded-[12px] py-2 px-1">
        <span className="block text-[11px] text-ink-muted font-medium">지방</span>
        <span className="block text-[14px] font-bold text-ink mt-0.5">
          {nutrition.fat}g
        </span>
      </div>
    </div>
  </section>
);

export default NutritionSection;
