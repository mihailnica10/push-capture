/**
 * Search Input Component
 * Debounced search input for filtering data
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../../styles/theme';

// ==================== Types ====================

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  showClearButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ==================== Component ====================

export const SearchInput = memo<SearchInputProps>(
  ({
    value: controlledValue,
    onChange,
    placeholder = 'Search...',
    debounceMs = 300,
    className = '',
    showClearButton = true,
    size = 'md',
  }) => {
    const [localValue, setLocalValue] = useState(controlledValue);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>();

    // Update local value when controlled value changes externally
    useEffect(() => {
      setLocalValue(controlledValue);
    }, [controlledValue]);

    // Debounced callback
    const debouncedOnChange = useCallback(
      (newValue: string) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      },
      [onChange, debounceMs]
    );

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    };

    // Handle clear button
    const handleClear = () => {
      setLocalValue('');
      onChange('');
    };

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const sizeStyles: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const iconSize: Record<string, string> = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
    };

    return (
      <div className={cn('relative', className)}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className={cn('text-neutral-400', iconSize[size] || iconSize.md)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 border border-neutral-300 rounded-lg',
            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'placeholder:text-neutral-400 transition-all',
            sizeStyles[size]
          )}
        />

        {showClearButton && localValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
            type="button"
          >
            <svg
              className={cn(iconSize[size])}
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
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
