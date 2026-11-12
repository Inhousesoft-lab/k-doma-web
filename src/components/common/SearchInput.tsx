import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * K-Doma 공통 검색 입력창
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = '요리나 재료를 검색해보세요',
  className = '',
  autoFocus = false,
}) => {
  return (
    <div
      className={`relative flex items-center w-full h-[46px] bg-white rounded-btn border border-line focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 px-3.5 transition-all ${className}`}
    >
      <Search className="w-[18px] h-[18px] text-ink-muted shrink-0 mr-2" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent text-[15px] text-ink placeholder-ink-muted outline-hidden"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-full text-ink-muted hover:text-ink-secondary hover:bg-line-subtle shrink-0 transition-colors"
          aria-label="검색어 지우기"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
