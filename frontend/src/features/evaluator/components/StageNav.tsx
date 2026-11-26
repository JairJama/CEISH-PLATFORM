import type { ReviewStage } from '../../../shared/types/platform.types';
import { cn } from '../../../utils/cn';

interface Props {
  stages: ReviewStage[];
  currentIndex: number;
}

const STAGE_ICON = {
  completed: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="currentColor" />
      <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'in-progress': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
      <circle cx="7" cy="7" r="2" fill="currentColor" />
    </svg>
  ),
  pending: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

const ICON_COLOR: Record<ReviewStage['status'], string> = {
  completed: 'text-emerald-600',
  'in-progress': 'text-[#ef3e3a]',
  pending: 'text-slate-400',
};

export function StageNav({ stages, currentIndex }: Props) {
  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-center">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] transition-opacity',
              i === currentIndex
                ? 'opacity-100 bg-red-50 border border-red-200'
                : stage.status === 'completed'
                  ? 'opacity-85'
                  : 'opacity-60',
            )}
          >
            <span className={ICON_COLOR[stage.status]}>{STAGE_ICON[stage.status]}</span>
            <span className="flex flex-col leading-tight">
              <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                Etapa {i + 1}
              </span>
              <span className="text-[12px] font-medium text-slate-800 whitespace-nowrap">{stage.name}</span>
            </span>
          </div>
          {i < stages.length - 1 && (
            <div className={cn('w-6 h-px mx-0.5', stage.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200')} />
          )}
        </div>
      ))}
    </div>
  );
}
