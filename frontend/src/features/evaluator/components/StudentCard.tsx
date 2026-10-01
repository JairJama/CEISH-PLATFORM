import { useNavigate } from 'react-router-dom';
import type { User, StudentSubmission } from '../../../shared/types/platform.types';

interface Props {
  student: User;
  submissions: StudentSubmission[];
}

const STATUS_CONFIG = {
  none: { label: 'Sin entrega', cls: 'badge--neutral' },
  pending: { label: 'Pendiente', cls: 'badge--warning' },
  'under-review': { label: 'En revisión', cls: 'badge--info' },
  reviewed: { label: 'Revisado', cls: 'badge--success' },
} as const;

export function StudentCard({ student, submissions }: Props) {
  const navigate = useNavigate();
  
  // Use the most recent submission to determine overall status
  const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;
  const statusKey = latestSubmission ? latestSubmission.status : 'none';
  const status = STATUS_CONFIG[statusKey];

  return (
    <details className="student-card evaluator-folder-card workflow-folder" style={{ padding: 0 }}>
      <summary className="student-card__header" style={{ padding: '20px', borderBottom: submissions.length ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div className="student-card__avatar">{student.name.charAt(0)}</div>
        <div className="student-card__info">
          <p className="student-card__name">{student.name}</p>
          <p className="student-card__email">{student.email}</p>
          {latestSubmission && (
            <p className="student-card__doc" title={latestSubmission.documentName}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M3 1h6a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2z" stroke="currentColor" strokeWidth="1" />
                <path d="M3.5 5h5M3.5 7h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="student-card__doc-name">{latestSubmission.documentName}</span>
            </p>
          )}
        </div>
        <div className="student-card__right">
          <span className={`badge ${status.cls}`}>{status.label}</span>
        </div>
      </summary>

      {submissions.length > 0 ? (
        <div className="workflow-folder__body" style={{ padding: '0 20px 20px', borderTop: 'none' }}>
          <p style={{ color: '#858e99', fontSize: '12px', marginBottom: '8px' }}>Investigaciones de este usuario:</p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
            {submissions.map((sub) => (
              <li key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#171c22', padding: '12px 14px', borderRadius: '6px', border: '1px solid #2a3038' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>{sub.documentName}</span>
                  <span style={{ color: '#858e99', fontSize: '11px' }}>
                    {sub.classificationStatus === 'classified' && sub.qualificationStatus === 'approved' ? 'Finalizada' : sub.status === 'under-review' ? 'En revisión' : 'Pendiente'}
                  </span>
                </div>
                <button className="eval-btn eval-btn--sm eval-btn--outline" onClick={(e) => { e.preventDefault(); navigate(`/evaluador/revision/${sub.id}`); }}>
                  {sub.status === 'reviewed' ? 'Ver revisión' : 'Revisar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="workflow-folder__body" style={{ padding: '0 20px 20px', borderTop: 'none' }}>
          <p className="student-card__no-doc">Sin investigaciones enviadas</p>
        </div>
      )}
    </details>
  );
}
