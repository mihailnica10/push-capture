/**
 * Multi Select Component
 * Dropdown for selecting multiple items
 */

import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '../../../styles/theme';

// ==================== Types ====================

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
  searchable?: boolean;
  showCounts?: boolean;
  selectAll?: boolean;
}

// ==================== Component ====================

export const MultiSelect = memo<MultiSelectProps>(
  ({
    options,
    value,
    onChange,
    placeholder = 'Select items...',
    className = '',
    maxDisplay = 3,
    searchable = true,
    showCounts = true,
    selectAll = true,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOptions = options.filter((opt) => value.includes(opt.value));
    const isAllSelected =
      filteredOptions.length > 0 &&
      filteredOptions.every((opt) => value.includes(opt.value) || opt.disabled);

    const toggleOption = (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    };

    const toggleSelectAll = () => {
      if (isAllSelected) {
        const enabledValues = filteredOptions
          .filter((opt) => !opt.disabled)
          .map((opt) => opt.value);
        onChange(value.filter((v) => !enabledValues.includes(v)));
      } else {
        const enabledValues = filteredOptions
          .filter((opt) => !opt.disabled && !value.includes(opt.value))
          .map((opt) => opt.value);
        onChange([...value, ...enabledValues]);
      }
    };

    const clearAll = () => {
      onChange([]);
      setIsOpen(false);
    };

    const displaySelected = () => {
      if (value.length === 0) return placeholder;
      if (value.length <= maxDisplay) {
        return selectedOptions.map((opt) => opt.label).join(', ');
      }
      return `${selectedOptions
        .slice(0, maxDisplay)
        .map((opt) => opt.label)
        .join(', ')} +${value.length - maxDisplay} more`;
    };

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-left',
            'hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
            'flex items-center justify-between gap-2'
          )}
        >
          <span className={cn('text-sm truncate', value.length === 0 && 'text-neutral-400')}>
            {displaySelected()}
          </span>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <svg
              className={cn(
                'w-4 h-4 text-neutral-400 transition-transform',
                isOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
            {/* Search */}
            {searchable && (
              <div className="p-2 border-b border-neutral-200">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {/* Select All */}
            {selectAll && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-2 text-sm border-b border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center',
                    isAllSelected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'
                  )}
                >
                  {isAllSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-medium">Select All</span>
              </button>
            )}

            {/* Options */}
            <div className="overflow-y-auto flex-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-neutral-500 text-sm">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && toggleOption(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full px-3 py-2 text-sm hover:bg-neutral-50 transition-colors',
                        'flex items-center justify-between gap-2',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        isSelected && 'bg-primary-50'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                            isSelected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="truncate">{option.label}</span>
                      </div>
                      {showCounts && option.count !== undefined && (
                        <span className="text-xs text-neutral-500 flex-shrink-0">
                          {option.count.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-xs text-neutral-500">{value.length} selected</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export default MultiSelect;
