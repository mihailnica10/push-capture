import { ComponentProps, forwardRef, useId } from 'react';
import { cn } from '../../styles/theme';

interface ToggleProps extends Omit<ComponentProps<'button'>, 'type' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, label, description, size = 'md', className, disabled, ...props }, ref) => {
    const toggleId = useId();
    const handleToggle = () => {
      if (!disabled) {
        onChange(!checked);
      }
    };

    const sizeClasses = {
      sm: 'w-8 h-4',
      md: 'w-11 h-6',
      lg: 'w-14 h-7',
    }[size];

    const thumbSizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }[size];

    const thumbTranslateClasses = {
      sm: checked ? 'translate-x-4' : 'translate-x-0.5',
      md: checked ? 'translate-x-6' : 'translate-x-0.5',
      lg: checked ? 'translate-x-7.5' : 'translate-x-0.5',
    }[size];

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <button
          ref={ref}
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            checked ? 'bg-primary-600' : 'bg-neutral-200',
            disabled && 'opacity-50 cursor-not-allowed',
            sizeClasses
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              thumbSizeClasses,
              thumbTranslateClasses
            )}
          />
        </button>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={toggleId}
                className="text-sm font-medium text-neutral-900 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && <p className="text-sm text-neutral-500">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
