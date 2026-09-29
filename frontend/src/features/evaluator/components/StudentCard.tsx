import { useNavigate } from 'react-router-dom';
import type { User, StudentSubmission } from '../../../shared/types/platform.types';

interface Props {
  student: User;
  submission: StudentSubmission | null;
}

const STATUS_CONFIG = {
  none: { label: 'Sin entrega', cls: 'badge--neutral' },
  pending: { label: 'Pendiente', cls: 'badge--warning' },
  'under-review': { label: 'En revisión', cls: 'badge--info' },
  reviewed: { label: 'Revisado', cls: 'badge--success' },
} as const;

export function StudentCard({ student, submission }: Props) {
  const navigate = useNavigate();
  const statusKey = submission ? submission.status : 'none';
  const status = STATUS_CONFIG[statusKey];

  const handleReview = () => {
    if (submission) navigate(`/evaluador/revision/${submission.id}`);
  };

  return (
    <div className="student-card">
      <div className="student-card__avatar">{student.name.charAt(0)}</div>
      <div className="student-card__info">
        <p className="student-card__name">{student.name}</p>
        <p className="student-card__email">{student.email}</p>
        {submission && (
          <p className="student-card__doc">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 1h6a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2z" stroke="currentColor" strokeWidth="1" />
              <path d="M3.5 5h5M3.5 7h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            {submission.documentName}
          </p>
        )}
      </div>
      <div className="student-card__right">
        <span className={`badge ${status.cls}`}>{status.label}</span>
        {submission ? (
          <button className="eval-btn eval-btn--sm eval-btn--outline" onClick={handleReview}>
            {submission.status === 'reviewed' ? 'Ver revisión' : 'Revisar'}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="student-card__no-doc">Sin documento</span>
        )}
      </div>
    </div>
  );
}
