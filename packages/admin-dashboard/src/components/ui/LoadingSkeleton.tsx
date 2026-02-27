import { HTMLAttributes } from 'react';
import { cn } from '../../styles/theme';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded-md h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-neutral-200',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// Card skeleton for loading states
interface CardSkeletonProps {
  showHeader?: boolean;
  showTitle?: boolean;
  lines?: number;
  showAvatar?: boolean;
}

export function CardSkeleton({
  showHeader = true,
  showTitle = true,
  lines = 3,
  showAvatar = false,
}: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
      {showHeader && (
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      )}

      {showTitle && <Skeleton variant="text" width="40%" height={24} />}

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => {
          const uniqueKey = `line-${lines}-${i}-${Math.random().toString(36).substring(7)}`;
          return <Skeleton key={uniqueKey} variant="text" width={i === lines - 1 ? '80%' : '100%'} />;
        })}
      </div>
    </div>
  );
}

// Table skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-5 py-3 bg-neutral-50 border-b border-neutral-200">
        {Array.from({ length: columns }).map((_, i) => {
          const key = `table-header-${columns}-${i}`;
          return <Skeleton key={key} variant="text" width={100} />;
        })}
      </div>

      {/* Rows */}
      <div className="divide-y divide-neutral-200">
        {Array.from({ length: rows }).map((_, rowIndex) => {
          const rowKey = `table-row-${rows}-${columns}-${rowIndex}`;
          return (
            <div key={rowKey} className="flex gap-4 px-5 py-4">
              {Array.from({ length: columns }).map((_, colIndex) => {
                const cellKey = `table-cell-${rows}-${columns}-${rowIndex}-${colIndex}`;
                return (
                  <Skeleton
                    key={cellKey}
                    variant="text"
                    width={colIndex === 0 ? '40%' : '20%'}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
