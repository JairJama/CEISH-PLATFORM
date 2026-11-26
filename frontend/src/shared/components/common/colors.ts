/**
 * Configuración de colores y tema (Tema claro principal + acento rojo institucional)
 * Referencia centralizada para utilidades que requieran tokens en TypeScript.
 */

export const colors = {
  // Color secundario / acento institucional (rojo CEISH)
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF3E3A',
    600: '#D92F2C',
    700: '#B91C1C',
  },
  // Estados de éxito
  success: {
    50: '#ECFDF5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  // Neutrales (Tema claro)
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Superficies
  surface: {
    light: '#FFFFFF',
    lighter: '#F8FAFC',
    dark: '#0F172A',
  },
  // Estados
  state: {
    error: '#DC2626',
    warning: '#D97706',
    info: '#4F46E5',
  },
  // Bordes
  border: '#E2E8F0',
};
