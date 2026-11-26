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

  const statusColor =
    criterion.status === 'approved'
      ? 'text-emerald-600'
      : criterion.status === 'rejected'
        ? 'text-[#ef3e3a]'
        : 'text-slate-300';

  const labelColor =
    criterion.status === 'approved'
      ? 'text-emerald-800'
      : criterion.status === 'rejected'
        ? 'text-[#b91c1c]'
        : 'text-slate-700';

  return (
    <div className={cn('border-b border-slate-200 transition-colors', isActive && 'bg-red-50/50')}>
      <div
        className={cn(
          'flex items-start gap-2.5 py-2.5 pr-3 pl-4 cursor-pointer select-none transition-colors',
          isActive ? 'hover:bg-red-50/80' : 'hover:bg-slate-50',
        )}
        onClick={toggle}
        role="button"
        tabIndex={0}
      >
        <div className={cn('shrink-0 flex items-center justify-center mt-0.5', statusColor)}>
          <StatusIcon status={criterion.status} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 tabular-nums leading-none">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className={cn('text-[12.5px] leading-snug', labelColor)}>{criterion.label}</p>
          {criterion.pageReference !== undefined && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#d92f2c] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1.5" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
                <path d="M3 4h4M3 6h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              pág. {criterion.pageReference}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded border cursor-pointer transition-colors',
              criterion.status === 'approved'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700',
            )}
            onClick={handleApprove}
            title="Aprobar"
            aria-label="Aprobar criterio"
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded border cursor-pointer transition-colors',
              criterion.status === 'rejected'
                ? 'bg-red-50 border-red-300 text-[#d92f2c] hover:bg-red-100'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700',
            )}
            onClick={handleReject}
            title="Rechazar"
            aria-label="Rechazar criterio"
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3.5 3.5l6 6M9.5 3.5l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <svg
            className={cn('text-slate-400 transition-transform duration-200 shrink-0 ml-0.5', expanded && 'rotate-180')}
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
        <div className="pt-0.5 pr-3.5 pb-3.5 pl-[42px]">
          {criterion.description && (
            <p className="text-[11.5px] text-slate-600 leading-relaxed mb-2.5 py-2 px-2.5 bg-slate-50 rounded border-l-[3px] border-l-slate-300">
              {criterion.description}
            </p>
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
