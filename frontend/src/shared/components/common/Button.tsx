import React from 'react';
import { colors, typography, shadows } from './colors';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Componente Button Mejorado
 * Botón sofisticado con animaciones fluidas y diseño moderno
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const { style: customStyle, ...buttonProps } = props;

    const baseStyles: React.CSSProperties = {
      fontFamily: typography.fontFamily.body,
      fontWeight: typography.fontWeight.semibold,
      border: 'none',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled || isLoading ? 0.65 : 1,
      letterSpacing: 'normal',
      position: 'relative',
      transform: 'none',
      minWidth: '0',
      padding: '0.75rem 1rem',
    };

    const sizeStyles: React.CSSProperties = {
      sm: {
        padding: '0.65rem 1rem',
        fontSize: typography.fontSize.sm,
        minHeight: '40px',
      },
      md: {
        padding: '0.8rem 1.2rem',
        fontSize: typography.fontSize.base,
        minHeight: '44px',
      },
      lg: {
        padding: '0.9rem 1.4rem',
        fontSize: typography.fontSize.lg,
        minHeight: '48px',
      },
    }[size];

    const variantStyles: React.CSSProperties = {
      primary: {
        backgroundImage: `linear-gradient(90deg, ${colors.primary[600]} 0%, ${colors.success[500]} 100%)`,
        color: colors.surface.light,
        boxShadow: '0 18px 35px rgba(37, 99, 235, 0.25)',
      },
      secondary: {
        backgroundColor: colors.success[500],
        color: colors.surface.light,
        boxShadow: shadows.lg,
      },
      outline: {
        backgroundColor: 'transparent',
        color: colors.primary[500],
        border: `1.5px solid ${colors.primary[500]}`,
      },
    }[variant];

    const hoverStyles: React.CSSProperties = {
      filter: 'brightness(1.08)',
      boxShadow: '0 10px 22px rgba(0, 80, 220, 0.18)',
    };

    return (
      <>
        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .button-spinner {
            display: inline-block;
            width: 1em;
            height: 1em;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }
        `}</style>

        <button
          ref={ref}
          style={{
            ...baseStyles,
            ...sizeStyles,
            ...variantStyles,
            ...customStyle,
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isLoading) {
              Object.assign(e.currentTarget.style, hoverStyles);
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, {
              ...baseStyles,
              ...sizeStyles,
              ...variantStyles,
              ...(customStyle),
            });
          }}
          disabled={disabled || isLoading}
          {...buttonProps}
        >
          {isLoading && (
            <span className="button-spinner" />
          )}
          <span style={{ opacity: isLoading ? 0.7 : 1 }}>
            {children}
          </span>
        </button>
      </>
    );
  }
);

Button.displayName = 'Button';

export default Button;
