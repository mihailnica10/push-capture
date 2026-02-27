/**
 * Date Range Picker Component
 * Custom date range selector for analytics
 */

import { useState } from 'react';
import { cn } from '../../../styles/theme';

// ==================== Types ====================

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset?: DateRangePreset;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  showPresets?: boolean;
  presets?: DateRangePreset[];
}

// ==================== Constants ====================

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Last 7 days',
  last30days: 'Last 30 days',
  last90days: 'Last 90 days',
  thisWeek: 'This week',
  lastWeek: 'Last week',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  thisYear: 'This year',
  custom: 'Custom',
};

const DEFAULT_PRESETS: DateRangePreset[] = [
  'today',
  'yesterday',
  'last7days',
  'last30days',
  'last90days',
  'thisMonth',
  'lastMonth',
];

// ==================== Helper Functions ====================

function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today':
      return { start: today, end: endOfDay, preset };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { start: yesterday, end: yesterdayEnd, preset };
    }

    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { start, end: endOfDay, preset };
    }

    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { start, end: endOfDay, preset };
    }

    case 'last90days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      return { start, end: endOfDay, preset };
    }

    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(start.getDate() - dayOfWeek);
      return { start, end: endOfDay, preset };
    }

    case 'lastWeek': {
      const dayOfWeek = today.getDay();
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(endOfLastWeek.getDate() - dayOfWeek - 1);
      endOfLastWeek.setHours(23, 59, 59, 999);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 6);
      startOfLastWeek.setHours(0, 0, 0, 0);
      return { start: startOfLastWeek, end: endOfLastWeek, preset };
    }

    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: endOfDay, preset };
    }

    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, preset };
    }

    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: endOfDay, preset };
    }

    default:
      return { start: today, end: endOfDay };
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseDate(input: string): Date | null {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// ==================== Component ====================

export const DateRangePicker = ({
  value,
  onChange,
  className = '',
  showPresets = true,
  presets = DEFAULT_PRESETS,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.start.toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(value.end.toISOString().split('T')[0]);

  const currentPreset = value.preset;
  const displayLabel = currentPreset
    ? PRESET_LABELS[currentPreset]
    : `${formatDate(value.start)} - ${formatDate(value.end)}`;

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setIsOpen(true);
      return;
    }

    const range = getDateRangeForPreset(preset);
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    const start = parseDate(customStart);
    const end = parseDate(customEnd);

    if (start && end) {
      // Set end to end of day
      end.setHours(23, 59, 59, 999);
      onChange({ start, end, preset: 'custom' });
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <svg
          className="w-4 h-4 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="font-medium">{displayLabel}</span>
        <svg
          className={cn('w-4 h-4 text-neutral-400 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-label="Close date picker"
          />
          <div className="absolute z-20 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 min-w-[300px]">
            {showPresets && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Quick Select
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg text-left transition-colors',
                        currentPreset === preset
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'hover:bg-neutral-100'
                      )}
                    >
                      {PRESET_LABELS[preset]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-neutral-200 pt-4">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Custom Range
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label htmlFor="custom-start-date" className="block text-xs text-neutral-500 mb-1">
                    From
                  </label>
                  <input
                    id="custom-start-date"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="custom-end-date" className="block text-xs text-neutral-500 mb-1">
                    To
                  </label>
                  <input
                    id="custom-end-date"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleCustomApply}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import { memo } from 'react';

export const MemoizedDateRangePicker = memo(DateRangePicker);

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
