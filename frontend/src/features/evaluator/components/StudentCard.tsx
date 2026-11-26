import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, StudentSubmission } from '../../../shared/types/platform.types';
import { badgeClass, btnClass, modalLayout } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

interface Props {
  student: User;
  submission: StudentSubmission | null;
  allSubmissions: StudentSubmission[];
}

const STATUS_CONFIG = {
  none: { label: 'Sin entrega', variant: 'neutral' },
  pending: { label: 'Pendiente', variant: 'warning' },
  'under-review': { label: 'En revisión', variant: 'info' },
  reviewed: { label: 'Revisado', variant: 'success' },
} as const;

const SUB_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  'under-review': 'En revisión',
  reviewed: 'Revisado',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SubmissionPickerModal({
  student,
  submissions,
  onSelect,
  onClose,
}: {
  student: User;
  submissions: StudentSubmission[];
  onSelect: (sub: StudentSubmission) => void;
  onClose: () => void;
}) {
  return (
    <div
      className={modalLayout.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn(modalLayout.panel, 'max-w-[560px]')} role="dialog" aria-modal="true" aria-labelledby="picker-title">
        <div className={modalLayout.header}>
          <h2 className={modalLayout.title} id="picker-title">Investigaciones de {student.name}</h2>
          <button className={modalLayout.close} onClick={onClose} aria-label="Cerrar" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-0">
          <ul className="list-none m-0 p-0">
            {submissions.map((sub) => {
              const statusLabel = SUB_STATUS_LABEL[sub.status] ?? sub.status;
              const statusVariant = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG]?.variant ?? 'neutral';
              return (
                <li key={sub.id} className="border-b border-slate-200 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onSelect(sub)}
                    className="w-full flex flex-col gap-1 px-5 py-3.5 bg-transparent border-0 cursor-pointer text-left text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex justify-between items-center gap-2.5 w-full">
                      <span className="font-semibold text-[13px] flex-1 truncate">{sub.title}</span>
                      <span className={badgeClass(statusVariant, 'shrink-0')}>{statusLabel}</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-slate-500">
                      <span>{sub.researchCode}</span>
                      <span>·</span>
                      <span>{formatDate(sub.submittedAt)}</span>
                      <span>·</span>
                      <span>{sub.documents.length} doc(s)</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function StudentCard({ student, submission, allSubmissions }: Props) {
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);
  const statusKey = submission ? submission.status : 'none';
  const status = STATUS_CONFIG[statusKey];
  const hasSubmissions = allSubmissions.length > 0;

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allSubmissions.length === 1) {
      navigate(`/evaluador/revision/${allSubmissions[0].id}`);
    } else if (allSubmissions.length > 1) {
      setShowPicker(true);
    }
  };

  const handleCardClick = () => {
    if (allSubmissions.length === 1) {
      navigate(`/evaluador/revision/${allSubmissions[0].id}`);
    } else if (allSubmissions.length > 1) {
      setShowPicker(true);
    }
  };

  return (
    <>
      <div
        className="relative min-h-[170px] flex flex-col gap-3.5 p-5 cursor-pointer bg-white border border-slate-200 rounded-[9px] shadow-xs overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg before:content-[''] before:absolute before:-top-px before:left-4 before:w-[58px] before:h-1 before:rounded-b before:bg-[#ef3e3a]"
        role={hasSubmissions ? 'button' : undefined}
        tabIndex={hasSubmissions ? 0 : undefined}
        onClick={hasSubmissions ? handleCardClick : undefined}
        onKeyDown={(event) => { if (hasSubmissions && (event.key === 'Enter' || event.key === ' ')) handleCardClick(); }}
      >
        <div className="flex items-start gap-3.5 w-full min-w-0">
          <div className="w-[38px] h-[38px] rounded-full bg-red-100 text-[#d92f2c] flex items-center justify-center text-[15px] font-bold shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[14px] font-semibold text-slate-900 truncate">{student.name}</p>
            <p className="text-[12px] text-slate-500 mt-0.5 truncate">{student.email}</p>
            {submission && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5" title={submission.documentName}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M3 1h6a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2z" stroke="currentColor" strokeWidth="1" />
                  <path d="M3.5 5h5M3.5 7h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <span className="truncate">
                  {allSubmissions.length > 1 ? `${allSubmissions.length} investigaciones` : submission.documentName}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2.5 w-full mt-auto pt-3.5 border-t border-slate-200 min-w-0">
          <span className={badgeClass(status.variant)}>{status.label}</span>
          {hasSubmissions ? (
            <button className={btnClass('outline', 'min-h-[28px] px-2.5 py-1')} onClick={handleReviewClick} type="button">
              {allSubmissions.length > 1 ? 'Seleccionar' : (submission?.status === 'reviewed' ? 'Ver revisión' : 'Revisar')}
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="text-[12px] text-slate-400">Sin documento</span>
          )}
        </div>
      </div>

      {showPicker && (
        <SubmissionPickerModal
          student={student}
          submissions={allSubmissions}
          onSelect={(sub) => {
            setShowPicker(false);
            navigate(`/evaluador/revision/${sub.id}`);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
