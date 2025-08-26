import React, { forwardRef } from 'react';
import { useMobileInteractions } from '../../hooks/useResponsive';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Accessible button component with mobile touch support
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = 'Loading...',
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const { getTouchProps } = useMobileInteractions();

    const baseClasses = [
      'accessible-button',
      `button-${variant}`,
      `button-${size}`,
      loading && 'button-loading',
      disabled && 'button-disabled',
      className
    ].filter(Boolean).join(' ');

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      onClick?.(e);
    };

    const touchProps = getTouchProps(() => {
      if (!loading && !disabled && onClick) {
        onClick({} as React.MouseEvent<HTMLButtonElement>);
      }
    });

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        onClick={handleClick}
        {...touchProps}
        {...props}
      >
        {loading && (
          <span className="loading-spinner" aria-hidden="true">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        
        {!loading && leftIcon && (
          <span className="button-icon button-icon-left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span className="button-text">
          {loading ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="button-icon button-icon-right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
        
        {/* Screen reader only loading announcement */}
        {loading && (
          <span className="sr-only">
            {loadingText}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

/**
 * Accessible icon button component
 */
interface AccessibleIconButtonProps extends Omit<AccessibleButtonProps, 'children'> {
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
}

export const AccessibleIconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(
  ({ icon, label, tooltip, className = '', ...props }, ref) => {
    return (
      <AccessibleButton
        ref={ref}
        className={`icon-button ${className}`}
        aria-label={label}
        title={tooltip || label}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
        <span className="sr-only">{label}</span>
      </AccessibleButton>
    );
  }
);

AccessibleIconButton.displayName = 'AccessibleIconButton';