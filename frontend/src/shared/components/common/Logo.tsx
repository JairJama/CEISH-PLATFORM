import React from 'react';
import { colors, typography, spacing } from './colors';
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  hideIcon?: boolean;
}

/**
 * Componente Logo
 * Marca visual de la Plataforma CEISH-Uleam con identidad distintiva
 */
const Logo: React.FC<LogoProps> = ({ size = 'md', showLabel = true, hideIcon = false }) => {
  const sizeMap = {
    sm: { icon: 40, text: '1.25rem', subtitle: '0.75rem' },
    md: { icon: 56, text: '1.75rem', subtitle: '0.875rem' },
    lg: { icon: 72, text: '2.25rem', subtitle: '1rem' },
  };

  const config = sizeMap[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      {!hideIcon && (
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fondo circular sutil */}
          <circle cx="32" cy="32" r="30" fill={colors.primary[50]} opacity="0.5" />

          {/* Documento principal */}
          <path
            d="M20 12C18.9 12 18 12.9 18 14V50C18 51.1 18.9 52 20 52H44C45.1 52 46 51.1 46 50V20L36 12H20Z"
            fill={colors.primary[500]}
            opacity="0.15"
            stroke={colors.primary[500]}
            strokeWidth="1.5"
          />

          {/* Líneas de contenido - representan texto/revisión */}
          <line
            x1="26"
            y1="26"
            x2="42"
            y2="26"
            stroke={colors.primary[500]}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="26"
            y1="34"
            x2="42"
            y2="34"
            stroke={colors.primary[500]}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="26"
            y1="42"
            x2="38"
            y2="42"
            stroke={colors.primary[500]}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Marca de aprobación/revisión */}
          <circle
            cx="48"
            cy="46"
            r="6"
            fill={colors.success[500]}
            opacity="0.8"
          />
          <path
            d="M46 46L47.2 47.2L49.6 44.8"
            stroke={colors.surface.light}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {showLabel && (
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              marginBottom: spacing.xs,
              fontSize: config.text,
              fontWeight: typography.fontWeight.bold,
              color: colors.primary[600],
              fontFamily: typography.fontFamily.display,
              letterSpacing: '-0.02em',
            }}
          >
            CEISH - ULEAM
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: config.subtitle,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray[600],
              fontFamily: typography.fontFamily.body,
              letterSpacing: '0.05em',
            }}
          >
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
