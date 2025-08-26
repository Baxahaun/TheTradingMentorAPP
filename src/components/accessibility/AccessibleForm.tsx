import React, { forwardRef, useId } from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

/**
 * Accessible input component with proper labeling and error handling
 */
export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, hint, required, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const { isMobile } = useResponsive();

    return (
      <div className={`form-field ${error ? 'form-field-error' : ''} ${className}`}>
        <label 
          htmlFor={inputId}
          className={`form-label ${required ? 'form-label-required' : ''}`}
        >
          {label}
          {required && (
            <span className="required-indicator" aria-label="required">
              *
            </span>
          )}
        </label>
        
        {hint && (
          <div id={hintId} className="form-hint">
            {hint}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`form-input ${isMobile ? 'form-input-mobile' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[
            hint ? hintId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined}
          required={required}
          {...props}
        />
        
        {error && (
          <div id={errorId} className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

/**
 * Accessible select component
 */
export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, error, hint, options, placeholder, required, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    const { isMobile } = useResponsive();

    return (
      <div className={`form-field ${error ? 'form-field-error' : ''} ${className}`}>
        <label 
          htmlFor={selectId}
          className={`form-label ${required ? 'form-label-required' : ''}`}
        >
          {label}
          {required && (
            <span className="required-indicator" aria-label="required">
              *
            </span>
          )}
        </label>
        
        {hint && (
          <div id={hintId} className="form-hint">
            {hint}
          </div>
        )}
        
        <select
          ref={ref}
          id={selectId}
          className={`form-select ${isMobile ? 'form-select-mobile' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[
            hint ? hintId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <div id={errorId} className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

/**
 * Accessible textarea component
 */
export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, error, hint, required, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;
    const { isMobile } = useResponsive();

    return (
      <div className={`form-field ${error ? 'form-field-error' : ''} ${className}`}>
        <label 
          htmlFor={textareaId}
          className={`form-label ${required ? 'form-label-required' : ''}`}
        >
          {label}
          {required && (
            <span className="required-indicator" aria-label="required">
              *
            </span>
          )}
        </label>
        
        {hint && (
          <div id={hintId} className="form-hint">
            {hint}
          </div>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={`form-textarea ${isMobile ? 'form-textarea-mobile' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[
            hint ? hintId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined}
          required={required}
          {...props}
        />
        
        {error && (
          <div id={errorId} className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';