import React, { useState } from 'react';
import { colors, typography, borderRadius, spacing } from './colors';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

/**
 * Componente Input reutilizable
 * Campo de texto con validación visual, etiqueta y mensajes de error/ayuda
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      required,
      type = 'text',
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const hasError = !!error;
    let borderColor = colors.border;

    if (hasError) {
      borderColor = colors.state.error;
    } else if (isFocused) {
      borderColor = colors.primary[500];
    }

    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label
            style={{
              display: 'block',
              marginBottom: spacing.sm,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.surface.dark,
              fontFamily: typography.fontFamily.body,
            }}
          >
            {label}
            {required && (
              <span style={{ color: colors.state.error, marginLeft: '0.25rem' }}>
                *
              </span>
            )}
          </label>
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: spacing.md,
                display: 'flex',
                alignItems: 'center',
                color: colors.gray[400],
              }}
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            type={type}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              width: '100%',
              padding: icon ? `0.75rem 1rem 0.75rem 2.5rem` : '0.75rem 1rem',
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.body,
              border: `1.5px solid ${borderColor}`,
              borderRadius: borderRadius.lg,
              backgroundColor: colors.surface.light,
              color: colors.surface.dark,
              transition: 'all 0.2s ease',
              outline: 'none',
              boxShadow: isFocused
                ? `0 0 0 3px ${colors.primary[50]}`
                : 'none',
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${props.name}-error` : undefined}
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${props.name}-error`}
            style={{
              marginTop: spacing.sm,
              fontSize: typography.fontSize.sm,
              color: colors.state.error,
              fontFamily: typography.fontFamily.body,
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            style={{
              marginTop: spacing.sm,
              fontSize: typography.fontSize.sm,
              color: colors.gray[500],
              fontFamily: typography.fontFamily.body,
              margin: 0,
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
