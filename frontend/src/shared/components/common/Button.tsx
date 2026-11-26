import React from 'react';
import { cn } from '../../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-[40px] px-4 py-2.5 text-sm',
  md: 'min-h-[44px] px-5 py-3 text-base',
  lg: 'min-h-[48px] px-6 py-3.5 text-lg',
};

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-br from-[#ef4945] to-[#d92f2c] text-white shadow-[0_10px_22px_rgba(239,62,58,0.22)] hover:brightness-105',
  secondary:
    'bg-emerald-600 text-white shadow-md hover:bg-emerald-700',
  outline:
    'bg-white text-[#d92f2c] border-[1.5px] border-[#ef3e3a] hover:bg-red-50',
};

/**
 * Componente Button
 * Botón reutilizable estilizado con Tailwind CSS y el acento rojo institucional.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 min-w-0 rounded-lg font-semibold transition-all duration-200 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : 'w-auto',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {isLoading && (
        <span className="inline-block w-[1em] h-[1em] border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      <span className={cn(isLoading && 'opacity-75')}>{children}</span>
    </button>
  ),
);

Button.displayName = 'Button';

export default Button;
