import React from 'react';
import { cn } from '../../../utils/cn';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  hideIcon?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 40, text: 'text-xl' },
  md: { icon: 56, text: 'text-[1.75rem]' },
  lg: { icon: 72, text: 'text-4xl' },
} as const;

/**
 * Componente Logo
 * Marca visual de la Plataforma CEISH-Uleam.
 */
const Logo: React.FC<LogoProps> = ({ size = 'md', showLabel = true, hideIcon = false }) => {
  const config = SIZE_MAP[size];

  return (
    <div className="flex flex-col items-center gap-4">
      {!hideIcon && (
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="32" cy="32" r="30" fill="#FEE2E2" opacity="0.65" />
          <path
            d="M20 12C18.9 12 18 12.9 18 14V50C18 51.1 18.9 52 20 52H44C45.1 52 46 51.1 46 50V20L36 12H20Z"
            fill="#EF3E3A"
            fillOpacity="0.12"
            stroke="#EF3E3A"
            strokeWidth="1.5"
          />
          <line x1="26" y1="26" x2="42" y2="26" stroke="#EF3E3A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="34" x2="42" y2="34" stroke="#EF3E3A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="42" x2="38" y2="42" stroke="#EF3E3A" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="48" cy="46" r="6" fill="#10B981" />
          <path
            d="M46 46L47.2 47.2L49.6 44.8"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {showLabel && (
        <div className="text-center">
          <h1 className={cn('m-0 mb-1 font-bold text-[#d92f2c] tracking-tight', config.text)}>
            CEISH - ULEAM
          </h1>
        </div>
      )}
    </div>
  );
};

export default Logo;
