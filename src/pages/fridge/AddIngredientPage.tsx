import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Ingredient, IngredientCategory, MasterIngredient } from '../../types';
import { ingredientService } from '../../services';
import { isSameIngredient } from '../../utils/ingredient';
import SearchInput from '../../components/common/SearchInput';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import IngredientImage from '../../components/common/IngredientImage';

/** 많이 고르는 순서. 여기 없는 재료는 뒤에 가나다순으로 붙는다 */
const POPULAR_ORDER = [
  '계란', '양파', '대파', '참치캔', '고추장', '간장', '두부', '감자',
  '양배추', '고추', '김', '된장', '당근', '우유', '돼지고기 삼겹살', '돼지고기 앞다리살', '스팸',
  '굴소스', '애호박', '참기름', '마요네즈', '사과', '고춧가루', '다진마늘',
  '케첩', '소면', '소금', '후추', '쌈장', '오이', '파스타면',
  '참치액젓', '식초', '올리브유', '쌀', '고등어', '무', '팽이버섯',
  '설탕', '마늘', '닭가슴살', '들기름', '식빵',
  '오징어', '떡국떡', '부침가루', '코인육수',
];

const popularRank = new Map(POPULAR_ORDER.map((name, i) => [name, i]));

/** 재료 추가 화면 섹션 순서와 이름 (재료 사전의 category) */
const CATEGORY_SECTIONS: { key: IngredientCategory; label: string }[] = [
  { key: 'SAUCE', label: '양념·소스' },
  { key: 'MEAT', label: '육류' },
  { key: 'SEAFOOD', label: '해산물' },
  { key: 'PRODUCE', label: '채소·과일' },
  { key: 'GRAIN', label: '면·곡물·빵' },
  { key: 'DAIRY', label: '달걀·유제품' },
  { key: 'ETC', label: '가공·기타' },
];

/** 상단 고정 헤더 높이(px). 칩으로 섹션 이동할 때 이만큼 + 검색·칩 영역 높이만큼 덜 내려간다 */
const HEADER_HEIGHT = 56;

function sortByPopularity(list: MasterIngredient[]): MasterIngredient[] {
  return [...list].sort((a, b) => {
    const ra = popularRank.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const rb = popularRank.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, 'ko');
  });
}

/**
 * 냉장고 재료 추가 화면 (/fridge/add)
 * - 재료 사전 전체를 카테고리 섹션별 4열 그리드로 보여주고 여러 개를 골라 한 번에 추가한다
 * - 카테고리 칩을 누르면 그 섹션으로 스크롤한다(스크롤 위치에 따라 칩이 바뀌는 기능은 아직 없음)
 * - 검색 중에는 칩을 숨기고 결과가 있는 섹션만 보여준다
 * - 이미 냉장고에 있는 재료는 '등록됨'으로 흐리게 표시하고 고를 수 없다
 * - 추가하면 냉장고로 돌아가 'n개 재료가 추가되었어요' 토스트를 띄운다
 */
export const AddIngredientPage: React.FC = () => {
  const navigate = useNavigate();
  const [masterList, setMasterList] = useState<MasterIngredient[]>([]);
  const [owned, setOwned] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<IngredientCategory | 'ALL'>('ALL');
  const stickyRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<IngredientCategory, HTMLElement | null>>>({});

  useEffect(() => {
    ingredientService.getMasterIngredients().then((list) => setMasterList(sortByPopularity(list)));
    ingredientService.getIngredients().then(setOwned).catch(() => setOwned([]));
  }, []);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().replace(/\s+/g, '').toLowerCase();
    if (!q) return masterList;
    const match = (s: string) => s.replace(/\s+/g, '').toLowerCase().includes(q);
    return masterList.filter((m) => match(m.name) || m.aliases?.some(match));
  }, [masterList, searchQuery]);

  /** 카테고리 순서대로 섹션을 만든다. 결과가 없는 섹션은 뺀다 */
  const sections = useMemo(
    () =>
      CATEGORY_SECTIONS.map((sec) => ({
        ...sec,
        items: filteredList.filter((m) => m.category === sec.key),
      })).filter((sec) => sec.items.length > 0),
    [filteredList],
  );

  const isSearching = searchQuery.trim().length > 0;

  /** 칩: 전체는 맨 위로, 카테고리는 그 섹션 제목이 검색·칩 영역 바로 아래에 오도록 스크롤 */
  const scrollToSection = (key: IngredientCategory | 'ALL') => {
    setActiveChip(key);
    if (key === 'ALL') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current[key];
    if (!el) return;
    const stickyHeight = stickyRef.current?.offsetHeight ?? 0;
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT - stickyHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const isRegistered = (name: string) => owned.some((i) => isSameIngredient(i.name, name));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const items = masterList
        .filter((m) => selectedIds.has(m.id))
        .map((m) => ({ name: m.name, zone: m.zone, imageKey: m.imageKey }));
      const added = await ingredientService.addIngredients(items);
      navigate('/fridge', { replace: true, state: { addedCount: added.length } });
    } catch (e) {
      console.error(e);
      setToastMessage('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-col px-5 pt-4 pb-[120px] bg-white">
      {/* 1. 제목 */}
      <h2 className="text-[24px] font-bold text-ink leading-[1.35] tracking-tight">
        지금 냉장고에
        <br />
        어떤 재료들이 있나요?
      </h2>
      <p className="mt-2 text-[15px] text-ink-muted leading-relaxed">
        냉장고에 있는 재료만 골라 주세요.
        <br />
        나머지는 나중에 추가해도 괜찮아요.
      </p>

      {/* 2. 검색 + 카테고리 칩 (상단 고정) */}
      <div ref={stickyRef} className="sticky top-[56px] z-20 bg-white pt-5 pb-3 -mx-5 px-5">
        <SearchInput
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActiveChip('ALL');
          }}
          onClear={() => setSearchQuery('')}
          placeholder="재료명 검색 (예: 간장, 양파, 버섯)"
        />
        {isSearching ? (
          <p className="mt-3 text-[13px] font-semibold text-ink-muted">검색 결과 {filteredList.length}가지</p>
        ) : (
          <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-5 px-5" role="tablist" aria-label="재료 카테고리">
            {[{ key: 'ALL' as const, label: '전체' }, ...CATEGORY_SECTIONS].map((chip) => {
              const isSelected = activeChip === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => scrollToSection(chip.key)}
                  className={`h-[34px] px-3.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-white font-bold'
                      : 'bg-white border border-line-strong text-ink hover:border-ink'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. 카테고리 섹션 (섹션마다 4열 그리드, 재료 전부 노출) */}
      {sections.length === 0 ? (
        <div className="py-16 text-center text-ink-muted text-[14px]">찾으시는 재료가 없어요.</div>
      ) : (
        <div className="flex flex-col gap-8 pt-3">
          {sections.map((sec) => (
            <section
              key={sec.key}
              ref={(el) => {
                sectionRefs.current[sec.key] = el;
              }}
              aria-labelledby={`ing-sec-${sec.key}`}
            >
              <h3 id={`ing-sec-${sec.key}`} className="flex items-baseline gap-1.5 mb-3">
                <span className="text-[17px] font-bold text-ink">{sec.label}</span>
                <span className="text-[13px] font-semibold text-ink-muted">{sec.items.length}</span>
              </h3>
              <div className="grid grid-cols-4 gap-x-2 gap-y-5">
                {sec.items.map((item) => {
                  const registered = isRegistered(item.name);
                  const selected = selectedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={registered}
                      onClick={() => toggleSelect(item.id)}
                      aria-pressed={selected}
                      aria-label={registered ? `${item.name} (등록됨)` : item.name}
                      className={`flex flex-col items-center gap-2 select-none transition-transform ${
                        registered ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                      }`}
                    >
                      <div
                        className={`relative w-full aspect-square max-w-[80px] rounded-[18px] bg-fill-subtle transition-shadow ${
                          selected ? 'ring-[2.5px] ring-primary ring-offset-2' : ''
                        }`}
                      >
                        <IngredientImage
                          name={item.name}
                          imageKey={item.imageKey}
                          className="w-full h-full rounded-[18px] p-1.5"
                        />
                        {selected && (
                          <span className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                        {registered && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-bold bg-white text-ink-muted rounded-full whitespace-nowrap">
                            등록됨
                          </span>
                        )}
                      </div>
                      {/* 재료명은 2줄까지 전부 보여주고, 넘으면 말줄임 */}
                      <span
                        className={`w-full text-center text-[14px] leading-tight line-clamp-2 break-keep ${
                          selected ? 'font-bold text-primary' : 'font-semibold text-ink'
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 4. 하단 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[630px] p-4 bg-white/95 backdrop-blur-md border-t border-line-subtle z-40 flex gap-2.5">
        <Button variant="neutral" size="lg" className="flex-[2]" onClick={() => navigate(-1)}>
          나중에 할게요
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-[3]"
          onClick={handleAdd}
          disabled={selectedCount === 0 || isSubmitting}
        >
          {selectedCount > 0 ? `${selectedCount}개 추가하기` : '재료를 골라 주세요'}
        </Button>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          isVisible={Boolean(toastMessage)}
          onClose={() => setToastMessage(null)}
          duration={2500}
        />
      )}
    </div>
  );
};

export default AddIngredientPage;
