import React from 'react';
import { cn } from '../../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

/**
 * Componente Input reutilizable
 * Campo de texto claro con validación visual, etiqueta y mensajes de error/ayuda.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, required, type = 'text', className, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-1.5 text-[12px] font-semibold text-slate-700">
            {label}
            {required && <span className="text-[#ef3e3a] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 flex items-center text-slate-400 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full py-2.5 text-[14px] rounded-[7px] bg-white text-slate-900 border-[1.5px] transition-all duration-150 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500',
              icon ? 'pl-10 pr-4' : 'px-3.5',
              hasError
                ? 'border-red-600 focus:ring-3 focus:ring-red-600/15'
                : 'border-slate-300 focus:border-[#ef3e3a] focus:ring-3 focus:ring-[#ef3e3a]/15',
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${props.name}-error` : undefined}
            {...props}
          />
        </div>

        {error && (
          <p id={`${props.name}-error`} className="mt-1.5 text-[12px] text-red-600">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-[12px] text-slate-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
