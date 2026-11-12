import React from 'react';
import { Users, Shield } from 'lucide-react';
import Card from '../components/common/Card';
import { authService } from '../services';

export const HouseholdPage: React.FC = () => {
  const members = authService.getHouseholdMembers();

  return (
    <div className="flex flex-col px-5 pt-3 pb-6 gap-4">
      {/* 1. 가구 이름 '우리 집' 카드 */}
      <section>
        <Card variant="mint" className="relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-teal shadow-xs">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-teal/80">
                FAMILY SPACE
              </span>
              <h2 className="text-[20px] font-bold text-ink leading-tight">
                우리 집
              </h2>
              <p className="text-[13px] text-teal mt-0.5">
                냉장고와 장바구니를 함께 공유하고 있어요
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* 2. 구성원 목록 자리 */}
      <section className="bg-white rounded-card p-5 shadow-card border border-line-subtle">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-ink">가구 구성원</h3>
          <span className="text-[13px] font-semibold text-primary">총 {members.length}명</span>
        </div>

        <div className="flex flex-col divide-y divide-line-subtle">
          {members.map((member) => (
            <div key={member.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold text-ink">{member.name}</span>
                  {member.role === 'ADMIN' ? (
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                      <Shield className="w-3 h-3" />
                      메인
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-ink-tertiary bg-fill px-2 py-0.5 rounded-full">
                      서브
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-ink-muted mt-0.5 block">{member.email ?? `@${member.id}`}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HouseholdPage;
