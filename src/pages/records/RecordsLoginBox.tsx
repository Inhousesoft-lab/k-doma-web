import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Button from '../../components/common/Button';

/**
 * 기록 화면 비로그인 안내 박스 (KD-48)
 * - 달력 아래 요리 카드 자리에 보여 준다. 어느 날짜를 골라도 같다
 * - [로그인하기] → 로그인 화면. 로그인하면 기록(/records)으로 돌아온다
 */
export const RecordsLoginBox: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center gap-2 px-5 py-9 rounded-card border border-line bg-fill-subtle">
      <Calendar className="w-8 h-8 text-ink-disabled" aria-hidden="true" />
      <h3 className="mt-1 text-[15px] font-bold text-ink">요리 기록을 보려면 로그인해 주세요.</h3>
      <p className="text-[13px] text-ink-muted leading-relaxed">
        로그인하면 내가 만든 요리와 예정한 요리가 달력에 표시돼요.
      </p>
      <Button
        variant="primary"
        size="md"
        fullWidth={false}
        className="mt-3"
        onClick={() => navigate(`/login?returnTo=${encodeURIComponent('/records')}`)}
      >
        로그인하기
      </Button>
    </div>
  );
};

export default RecordsLoginBox;
