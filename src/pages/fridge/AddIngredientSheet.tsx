import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { StorageZone } from '../../types';
import { ingredientService } from '../../services';
import { MasterIngredient } from '../../types';
import BottomSheet from '../../components/common/BottomSheet';
import SearchInput from '../../components/common/SearchInput';
import Button from '../../components/common/Button';

export interface AddIngredientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  zone: StorageZone;
  existingNames: Set<string>;
  onAdded: (count: number) => void;
}

export const AddIngredientSheet: React.FC<AddIngredientSheetProps> = ({
  isOpen,
  onClose,
  zone,
  existingNames,
  onAdded,
}) => {
  const [masterList, setMasterList] = useState<MasterIngredient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      ingredientService.getMasterIngredients(zone).then((list) => {
        setMasterList(list);
      });
      setSelectedIds(new Set());
      setSearchQuery('');
    }
  }, [isOpen, zone]);

  // 검색 필터링
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return masterList;
    return masterList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.aliases?.some((alias) => alias.toLowerCase().includes(q))
    );
  }, [masterList, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const itemsToAdd = masterList
        .filter((m) => selectedIds.has(m.id))
        .map((m) => ({
          name: m.name,
          zone: m.zone,
          imageKey: m.imageKey,
        }));

      const added = await ingredientService.addIngredients(itemsToAdd);
      onAdded(added.length);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const zoneTitle = zone === 'SEASONING' ? '양념 선반 재료 추가' : '냉장고 재료 추가';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={zoneTitle}>
      <div className="flex flex-col gap-3">
        {/* 검색창 */}
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="재료명 검색 (예: 간장, 양파, 버섯)"
        />

        {/* 재료 리스트 */}
        <div className="max-h-[360px] overflow-y-auto no-scrollbar flex flex-col gap-1 py-1">
          {filteredList.length === 0 ? (
            <div className="py-10 text-center text-ink-muted text-[14px]">
              찾으시는 재료가 없어요.
            </div>
          ) : (
            filteredList.map((item) => {
              const isAlreadyRegistered = existingNames.has(item.name);
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!isAlreadyRegistered) {
                      toggleSelect(item.id);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-[12px] transition-colors select-none ${
                    isAlreadyRegistered
                      ? 'bg-fill-subtle opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary-light cursor-pointer'
                      : 'hover:bg-fill cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[8px] bg-thumb flex items-center justify-center text-[9px] text-ink-muted font-semibold shrink-0">
                      AI
                    </div>
                    <div>
                      <span className="text-[14px] font-semibold text-ink">
                        {item.name}
                      </span>
                      {item.aliases && item.aliases.length > 0 && (
                        <span className="text-[11px] text-ink-muted ml-1.5">
                          ({item.aliases[0]})
                        </span>
                      )}
                    </div>
                  </div>

                  {isAlreadyRegistered ? (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-line text-ink-muted rounded-full">
                      등록됨
                    </span>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-line-strong bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 하단 추가 버튼 */}
        <div className="pt-2 border-t border-line-subtle">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || isSubmitting}
            className="w-full"
          >
            {selectedIds.size > 0
              ? `${selectedIds.size}개 재료 추가하기`
              : '추가할 재료를 선택해주세요'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default AddIngredientSheet;
