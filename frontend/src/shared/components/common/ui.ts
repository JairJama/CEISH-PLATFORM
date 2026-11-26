import { cn } from '../../../utils/cn';

/** Clases Tailwind compartidas para botones de acciones del flujo */
export const btnBase =
  'inline-flex items-center justify-center gap-1.5 min-h-[34px] px-3.5 py-2 rounded-[7px] text-[12px] font-bold leading-none whitespace-nowrap border transition-colors duration-150 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-[#fecaca] focus-visible:outline-offset-2';

export const btnVariants = {
  primary:
    'border-[#ef3e3a] bg-gradient-to-br from-[#f04843] to-[#d92f2c] text-white shadow-[0_6px_16px_rgba(239,62,58,0.22)] hover:from-[#ef3e3a] hover:to-[#c82320] hover:border-[#d92f2c]',
  outline:
    'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900',
  dangerOutline:
    'border-red-300 bg-white text-[#d92f2c] hover:bg-red-50 hover:border-red-400',
  ghost:
    'border-slate-200 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300',
  sm: 'min-h-[28px] px-2.5 py-1 text-[12px]',
} as const;

export function btnClass(
  variant: keyof Pick<typeof btnVariants, 'primary' | 'outline' | 'dangerOutline' | 'ghost'> = 'outline',
  extra?: string,
): string {
  return cn(btnBase, btnVariants[variant], extra);
}

/** Clases Tailwind compartidas para badges de estado */
export const badgeBase =
  'inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold whitespace-nowrap border';

export const badgeVariants = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  neutral: 'bg-slate-100 border-slate-200 text-slate-600',
  danger: 'bg-red-50 border-red-200 text-[#b91c1c]',
} as const;

export function badgeClass(variant: keyof typeof badgeVariants = 'neutral', extra?: string): string {
  return cn(badgeBase, badgeVariants[variant], extra);
}

/** Clases Tailwind compartidas para páginas del shell */
export const pageLayout = {
  root: 'relative flex flex-col min-h-full max-w-[1440px] mx-auto min-w-0',
  header:
    'flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 px-4 pt-5 pb-4 sm:px-6 sm:pt-7 sm:pb-5 lg:px-[42px] lg:pt-[34px] lg:pb-6 bg-transparent shrink-0',
  kicker: 'block mb-2 text-[#ef3e3a] text-[10px] font-extrabold tracking-[0.13em] uppercase',
  title: 'text-slate-900 text-[22px] sm:text-[26px] lg:text-[30px] font-semibold tracking-[-0.035em] leading-tight',
  subtitle: 'mt-1.5 text-slate-500 text-[13px]',
  body: 'flex-1 px-4 pb-6 sm:px-6 sm:pb-8 lg:px-[42px] lg:pb-[42px] flex flex-col gap-[18px] min-w-0',
  loading: 'flex items-center gap-2.5 text-slate-500 text-[13px] py-8',
  emptyState:
    'flex flex-col items-center gap-3 text-center py-12 px-6 sm:py-16 sm:px-8 bg-white border border-dashed border-slate-300 rounded-xl shadow-xs',
  emptyTitle: 'text-[16px] font-semibold text-slate-900',
  emptyDesc: 'text-[13px] text-slate-500 leading-relaxed max-w-[340px]',
  alertError:
    'px-3.5 py-2.5 rounded-md text-[13px] text-[#b91c1c] bg-red-50 border border-red-200',
} as const;

/** Clases Tailwind compartidas para modales */
export const modalLayout = {
  backdrop:
    'fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[2px] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto',
  panel:
    'bg-white border border-slate-200 rounded-xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] w-full max-w-[480px] max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-48px)] flex flex-col overflow-hidden text-slate-900',
  header:
    'flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 shrink-0 bg-white',
  title: 'text-[16px] font-semibold text-slate-900',
  close:
    'flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors',
  body: 'p-4 sm:p-5 flex flex-col gap-4 min-h-0 overflow-y-auto',
  footer:
    'flex justify-end gap-2.5 px-4 sm:px-5 py-3.5 border-t border-slate-200 shrink-0 bg-slate-50/70',
  field: 'flex flex-col gap-1.5',
  label: 'text-[11px] font-bold text-slate-500 uppercase tracking-[0.07em]',
  input:
    'w-full h-[38px] px-3 border border-slate-300 rounded-md text-[13px] text-slate-900 bg-white outline-none transition focus:border-[#ef3e3a] focus:ring-3 focus:ring-[#ef3e3a]/15 placeholder:text-slate-400',
  textarea:
    'w-full px-3 py-2.5 border border-slate-300 rounded-md text-[13px] text-slate-900 bg-white resize-y leading-relaxed outline-none transition focus:border-[#ef3e3a] focus:ring-3 focus:ring-[#ef3e3a]/15 placeholder:text-slate-400',
} as const;

export const spinnerClass =
  'w-6 h-6 border-2 border-slate-200 border-t-[#ef3e3a] rounded-full animate-spin shrink-0';
