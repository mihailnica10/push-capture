import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { forwardRef, HTMLAttributes } from 'react';
import { cn, variant as styles } from '../../styles/theme';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconProp;
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant: badgeVariant = 'default',
      size = 'md',
      icon,
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = styles.badge.base;
    const variantClasses = styles.badge.variants[badgeVariant];
    const sizeClasses = {
      sm: 'text-[10px] px-1.5 py-0.5',
      md: 'text-xs px-2 py-1',
      lg: 'text-sm px-2.5 py-1',
    }[size];

    return (
      <span
        ref={ref}
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
        {icon && <FontAwesomeIcon icon={icon} className="text-[10px]" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge preset with common statuses
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status:
    | 'online'
    | 'offline'
    | 'busy'
    | 'away'
    | 'draft'
    | 'published'
    | 'archived'
    | 'active'
    | 'inactive'
    | 'pending'
    | 'success'
    | 'error'
    | 'warning'
    | 'failed';
}

const statusVariantMap: Record<StatusBadgeProps['status'], BadgeProps['variant']> = {
  online: 'success',
  offline: 'default',
  busy: 'error',
  away: 'warning',
  draft: 'default',
  published: 'success',
  archived: 'default',
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  success: 'success',
  error: 'error',
  warning: 'warning',
  failed: 'error',
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    return (
      <Badge ref={ref} variant={statusVariantMap[status]} {...props}>
        {status}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
