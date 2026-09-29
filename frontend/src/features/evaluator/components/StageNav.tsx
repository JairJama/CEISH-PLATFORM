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

export function StageNav({ stages, currentIndex }: Props) {
  return (
    <div className="stage-nav">
      {stages.map((stage, i) => (
        <div key={stage.id} className="stage-nav__item-wrap">
          <div
            className={cn(
              'stage-nav__item',
              `stage-nav__item--${stage.status}`,
              i === currentIndex && 'stage-nav__item--current'
            )}
          >
            <span className={`stage-nav__icon stage-nav__icon--${stage.status}`}>
              {STAGE_ICON[stage.status]}
            </span>
            <span className="stage-nav__label">
              <span className="stage-nav__order">Etapa {i + 1}</span>
              <span className="stage-nav__name">{stage.name}</span>
            </span>
          </div>
          {i < stages.length - 1 && (
            <div className={cn('stage-nav__connector', stage.status === 'completed' && 'stage-nav__connector--done')} />
          )}
        </div>
      ))}
    </div>
  );
}
