import React from 'react';

/** 요리 상세 조리 순서 (책 원문 기준 단계) */
const StepsSection: React.FC<{ steps: string[] }> = ({ steps }) => (
  <section className="bg-white rounded-card p-4.5 border border-line">
    <h3 className="text-[16px] font-bold text-ink mb-3">
      조리 순서
    </h3>

    <div className="flex flex-col gap-3.5">
      {steps.map((stepText, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {idx + 1}
          </div>
          <p className="text-[14px] text-ink leading-relaxed flex-1 pt-0.5">
            {stepText}
          </p>
        </div>
      ))}
    </div>
  </section>
);

export default StepsSection;
