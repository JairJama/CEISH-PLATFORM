import React from 'react';
import { cn } from '../../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
}

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-6 sm:p-8',
  lg: 'p-6 sm:p-10',
};

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-white border border-slate-200 shadow-xs',
  elevated: 'bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.08)]',
};

/**
 * Componente Card
 * Contenedor visual claro con bordes suaves y elevación sutil.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'elevated', padding = 'lg', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl transition-all duration-200', PADDING_CLASSES[padding], VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';

export default Card;
