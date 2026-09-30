import { useState } from 'react';
import type { Criterion, CriterionStatus } from '../../types/evaluation.types';
import { ObservationForm } from './ObservationForm';
import { cn } from '../../../../utils/cn';

interface Props {
  criterion: Criterion;
  index: number;
  isActive: boolean;
  currentPdfPage: number;
  onActivate: () => void;
  onStatusChange: (id: string, status: CriterionStatus) => void;
  onObservationChange: (id: string, observation: string) => void;
  onPageRefChange: (id: string, page: number | undefined) => void;
}

const StatusIcon = ({ status }: { status: CriterionStatus }) => {
  if (status === 'approved') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M5 8l2.5 2.5L11 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'rejected') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export function CriterionItem({
  criterion,
  index,
  isActive,
  currentPdfPage,
  onActivate,
  onStatusChange,
  onObservationChange,
  onPageRefChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    setExpanded((e) => !e);
    onActivate();
  };

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange(criterion.id, criterion.status === 'approved' ? 'pending' : 'approved');
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange(criterion.id, criterion.status === 'rejected' ? 'pending' : 'rejected');
  };

  return (
    <div
      className={cn(
        'criterion',
        `criterion--${criterion.status}`,
        isActive && 'criterion--active'
      )}
    >
      <div className="criterion__header" onClick={toggle} role="button" tabIndex={0}>
        <div className={`criterion__status-icon criterion__status-icon--${criterion.status}`}>
          <StatusIcon status={criterion.status} />
        </div>

        <div className="criterion__content">
          <span className="criterion__index">{String(index + 1).padStart(2, '0')}</span>
          <p className="criterion__label">{criterion.label}</p>
          {criterion.pageReference !== undefined && (
            <span className="criterion__page-ref">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1.5" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
                <path d="M3 4h4M3 6h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              pág. {criterion.pageReference}
            </span>
          )}
        </div>

        <div className="criterion__actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={cn(
              'criterion__action-btn',
              criterion.status === 'approved' && 'criterion__action-btn--approve'
            )}
            onClick={handleApprove}
            title="Aprobar"
            aria-label="Aprobar criterio"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={cn(
              'criterion__action-btn',
              criterion.status === 'rejected' && 'criterion__action-btn--reject'
            )}
            onClick={handleReject}
            title="Rechazar"
            aria-label="Rechazar criterio"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3.5 3.5l6 6M9.5 3.5l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <svg
            className={cn('criterion__chevron', expanded && 'criterion__chevron--open')}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="criterion__body">
          {criterion.description && (
            <p className="criterion__description">{criterion.description}</p>
          )}
          <ObservationForm
            criterion={criterion}
            currentPdfPage={currentPdfPage}
            onObservationChange={onObservationChange}
            onPageRefChange={onPageRefChange}
          />
        </div>
      )}
    </div>
  );
}
