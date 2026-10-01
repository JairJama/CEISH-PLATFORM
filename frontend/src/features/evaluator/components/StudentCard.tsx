import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, StudentSubmission } from '../../../shared/types/platform.types';

interface Props {
  student: User;
  submission: StudentSubmission | null;
  allSubmissions: StudentSubmission[];
}

const STATUS_CONFIG = {
  none: { label: 'Sin entrega', cls: 'badge--neutral' },
  pending: { label: 'Pendiente', cls: 'badge--warning' },
  'under-review': { label: 'En revisión', cls: 'badge--info' },
  reviewed: { label: 'Revisado', cls: 'badge--success' },
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
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="picker-title" style={{ maxWidth: '560px' }}>
        <div className="modal__header">
          <h2 className="modal__title" id="picker-title">Investigaciones de {student.name}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Cerrar" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal__body" style={{ padding: '0' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {submissions.map((sub) => {
              const statusLabel = SUB_STATUS_LABEL[sub.status] ?? sub.status;
              const statusCls = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG]?.cls ?? 'badge--neutral';
              return (
                <li key={sub.id} style={{ borderBottom: '1px solid #282e36' }}>
                  <button
                    type="button"
                    onClick={() => onSelect(sub)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '14px 20px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--c-text)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#171c22'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.title}
                      </span>
                      <span className={`badge ${statusCls}`} style={{ flexShrink: 0 }}>{statusLabel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--c-text-muted)' }}>
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
        className="student-card evaluator-folder-card"
        role={hasSubmissions ? 'button' : undefined}
        tabIndex={hasSubmissions ? 0 : undefined}
        onClick={hasSubmissions ? handleCardClick : undefined}
        onKeyDown={(event) => { if (hasSubmissions && (event.key === 'Enter' || event.key === ' ')) handleCardClick(); }}
      >
        <div className="student-card__header">
          <div className="student-card__avatar">{student.name.charAt(0)}</div>
          <div className="student-card__info">
            <p className="student-card__name">{student.name}</p>
            <p className="student-card__email">{student.email}</p>
            {submission && (
              <p className="student-card__doc" title={submission.documentName}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3 1h6a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2z" stroke="currentColor" strokeWidth="1" />
                  <path d="M3.5 5h5M3.5 7h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <span className="student-card__doc-name">
                  {allSubmissions.length > 1 ? `${allSubmissions.length} investigaciones` : submission.documentName}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="student-card__right">
          <span className={`badge ${status.cls}`}>{status.label}</span>
          {hasSubmissions ? (
            <button className="eval-btn eval-btn--sm eval-btn--outline" onClick={handleReviewClick}>
              {allSubmissions.length > 1 ? 'Seleccionar' : (submission?.status === 'reviewed' ? 'Ver revisión' : 'Revisar')}
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="student-card__no-doc">Sin documento</span>
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
