import React from 'react';
import { RecipeSauce } from '../../types';
import { scaleAmount } from '../../utils/amount';

interface SauceSectionProps {
  sauce: RecipeSauce;
  servings: number;
  baseServings: number;
}

/** 요리 상세 '소스': 곁들이는 소스의 재료(인분에 맞춰 표시)와 만드는 순서 */
const SauceSection: React.FC<SauceSectionProps> = ({ sauce, servings, baseServings }) => (
  <section className="bg-white rounded-card p-4.5 border border-line">
    <div className="mb-3">
      <span className="text-[12px] font-bold text-ink-muted">소스</span>
      <h3 className="text-[16px] font-bold text-ink">{sauce.name}</h3>
    </div>

    {sauce.ingredients && sauce.ingredients.length > 0 && (
      <p className="text-[13px] text-ink-secondary bg-fill rounded-[10px] px-3 py-2 mb-3.5">
        {sauce.ingredients
          .map((item) => {
            const qty = scaleAmount(item.amount, servings, baseServings);
            return qty === '-' ? item.name : `${item.name} ${qty}`;
          })
          .join(' · ')}
      </p>
    )}

    <div className="flex flex-col gap-3.5">
      {sauce.steps.map((stepText, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-fill text-ink text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {idx + 1}
          </div>
          <p className="text-[14px] text-ink leading-relaxed flex-1 pt-0.5">{stepText}</p>
        </div>
      ))}
    </div>
  </section>
);

export default SauceSection;
