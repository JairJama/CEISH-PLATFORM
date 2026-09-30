import React from 'react';
import { colors, borderRadius, shadows, spacing } from './colors';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * Componente Card Mejorado
 * Contenedor visual elegante con sombras sofisticadas y proporciones equilibradas
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'lg',
      children,
      ...props
    },
    ref
  ) => {
    const paddingMap = {
      sm: spacing.md,
      md: spacing.lg,
      lg: spacing['2xl'],
    };

    const variantStyles: React.CSSProperties = {
      default: {
        backgroundColor: colors.surface.light,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
      },
      elevated: {
        backgroundColor: colors.surface.light,
        boxShadow: shadows.lg,
        border: `1px solid ${colors.border}`,
      },
    }[variant];

    return (
      <div
        ref={ref}
        style={{
          borderRadius: borderRadius.xl,
          padding: paddingMap[padding],
          ...variantStyles,
          transition: 'all 0.3s ease',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
