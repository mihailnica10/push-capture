/**
 * Sortable Table Component
 * Reusable table with sorting capabilities
 */

import { useMemo, useState } from 'react';
import { cn } from '../../../styles/theme';

// ==================== Types ====================

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: Flexible render function requires any
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  emptyMessage?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

// ==================== Helper Components ====================

const SortIcon = ({ direction }: { direction: SortDirection }) => {
  if (direction === null) {
    return (
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
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }

  if (direction === 'asc') {
    return (
      <svg
        className="w-4 h-4 text-primary-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

// ==================== Sortable Table ====================

// biome-ignore lint/suspicious/noExplicitAny: Generic table requires flexible typing
export const SortableTable = <T extends Record<string, any>>({
  data,
  columns,
  defaultSortKey,
  defaultSortDirection = 'desc',
  onRowClick,
  rowClassName,
  emptyMessage = 'No data available',
  className = '',
}: SortableTableProps<T>) => {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  if (data.length === 0) {
    return (
      <div className={cn('text-center py-12 text-neutral-500', className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider',
                  column.sortable &&
                    'cursor-pointer hover:bg-neutral-100 transition-colors select-none',
                  column.headerClassName
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <SortIcon direction={sortKey === column.key ? sortDirection : null} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {sortedData.map((row, index) => (
            <tr
              key={row.id || index}
              className={cn(
                'hover:bg-neutral-50 transition-colors',
                onRowClick && 'cursor-pointer',
                rowClassName?.(row)
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-4 py-3 text-sm text-neutral-700', column.className)}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

import { memo } from 'react';

// Memoized wrapper for performance
export const MemoizedSortableTable = memo(SortableTable) as typeof SortableTable;

SortableTable.displayName = 'SortableTable';

export default SortableTable;
