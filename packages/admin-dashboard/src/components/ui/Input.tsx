import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn, variant } from '../../styles/theme';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: IconProp;
  iconPosition?: 'left' | 'right';
  helperText?: string;
  variant?: 'default' | 'error' | 'success';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      icon,
      iconPosition = 'left',
      helperText,
      variant: variantProp = error ? 'error' : 'default',
      id,
      ...props
    },
    ref
  ) => {
    const [focus, setFocus] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <FontAwesomeIcon icon={icon} className="text-sm" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              variant.input.base,
              variant.input.variants[variantProp],
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              focus && 'ring-2',
              className
            )}
            onFocus={(e) => {
              setFocus(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocus(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <FontAwesomeIcon icon={icon} className="text-sm" />
            </div>
          )}
        </div>

        {(hasError || helperText) && (
          <p className={cn('text-xs mt-1.5', hasError ? 'text-error-500' : 'text-neutral-500')}>
            {hasError ? error : helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, rows = 3, id, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            variant.input.base,
            error && 'border-error-300 focus:ring-error-500 focus:border-error-500',
            'resize-none',
            className
          )}
          {...props}
        />

        {(hasError || helperText) && (
          <p className={cn('text-xs mt-1.5', hasError ? 'text-error-500' : 'text-neutral-500')}>
            {hasError ? error : helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={cn(
            variant.input.base,
            error && 'border-error-300 focus:ring-error-500 focus:border-error-500',
            'cursor-pointer',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {(hasError || helperText) && (
          <p className={cn('text-xs mt-1.5', hasError ? 'text-error-500' : 'text-neutral-500')}>
            {hasError ? error : helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
