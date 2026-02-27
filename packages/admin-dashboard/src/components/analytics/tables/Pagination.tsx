/**
 * Pagination Component
 * Reusable pagination for tables
 */

import { memo } from 'react';
import { cn } from '../../../styles/theme';

// ==================== Types ====================

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
  showInfo?: boolean;
}

// ==================== Component ====================

export const Pagination = memo<PaginationProps>(
  ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    className = '',
    showInfo = true,
  }) => {
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const showEllipsis = totalPages > 7;

      if (!showEllipsis) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }

      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);

      return pages;
    };

    const startItem = totalItems ? (currentPage - 1) * (itemsPerPage || 10) + 1 : 0;
    const endItem = totalItems ? Math.min(currentPage * (itemsPerPage || 10), totalItems) : 0;

    return (
      <div className={cn('flex items-center justify-between', className)}>
        {showInfo && totalItems && itemsPerPage && (
          <div className="text-sm text-neutral-600">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              'px-3 py-2 text-sm rounded-lg transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'enabled:hover:bg-neutral-100'
            )}
          >
            Previous
          </button>

          {getPageNumbers().map((page) =>
            typeof page === 'number' ? (
              <button
                type="button"
                key={`page-${page}`}
                onClick={() => onPageChange(page)}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg transition-colors min-w-[40px]',
                  currentPage === page ? 'bg-primary-600 text-white' : 'hover:bg-neutral-100'
                )}
              >
                {page}
              </button>
            ) : (
              <span key={`ellipsis-${page}`} className="px-2 py-2 text-neutral-400">
                {page}
              </span>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              'px-3 py-2 text-sm rounded-lg transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'enabled:hover:bg-neutral-100'
            )}
          >
            Next
          </button>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;
