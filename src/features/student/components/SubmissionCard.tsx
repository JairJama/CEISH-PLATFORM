import type { StudentSubmission } from '../../../shared/types/platform.types';

interface Props {
  submission: StudentSubmission;
  onView: (documentId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onSubmitCorrections: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente de revisión', cls: 'badge--warning' },
  'under-review': { label: 'En revisión', cls: 'badge--info' },
  reviewed: { label: 'Revisado', cls: 'badge--success' },
} as const;

const CLASSIFICATION_LABEL = {
  'awaiting-assignment': 'Esperando asignación de un miembro CEISH',
  'awaiting-first': 'Pendiente de primera estratificación',
  'awaiting-second': 'Pendiente de segunda estratificación',
  'awaiting-consensus': 'Los estratificadores están resolviendo el consenso',
  classified: 'Clasificación de riesgo completada',
  cancelled: 'Investigación cancelada por administración',
} as const;

const RISK_LABEL = {
  'no-risk': 'Sin riesgo',
  'minimal-risk': 'Riesgo mínimo',
  'greater-than-minimal': 'Riesgo mayor al mínimo',
} as const;

const QUALIFICATION_LABEL = {
  'pending-review': 'Pendiente de calificación',
  'corrections-required': 'Correcciones solicitadas',
  resubmitted: 'Informe enviado; esperando nueva revisión',
  approved: 'Investigación aprobada',
  cancelled: 'Investigación cancelada por el calificador',
  expired: 'Investigación anulada por vencimiento del plazo',
} as const;

export function SubmissionCard({ submission, onView, onEdit, onDelete, onSubmitCorrections }: Props) {
  const status = STATUS_CONFIG[submission.status];
  const isReviewed = submission.status === 'reviewed';
  const canModify = submission.classificationStatus === 'awaiting-assignment'
    || submission.classificationStatus === 'awaiting-first';

  return (
    <div className="submission-card">
      <div className="submission-card__top">
        <div className="submission-card__doc-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#eff6ff" />
            <path d="M7 5h14a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="#2563eb" strokeWidth="1.3" fill="none" />
            <path d="M9 11h10M9 14.5h10M9 18h6" stroke="#2563eb" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
        <div className="submission-card__info">
          <span className="submission-card__code">{submission.researchCode}</span>
          <p className="submission-card__filename">{submission.title}</p>
          <p className="submission-card__date">Enviado el {formatDateTime(submission.submittedAt)}</p>
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      {submission.comment && (
        <div className="submission-card__comment">
          <span className="submission-card__comment-label">Tu comentario</span>
          <p className="submission-card__comment-text">{submission.comment}</p>
        </div>
      )}

      <div className="submission-card__documents">
        <div className="submission-card__section-title">
          <span>Documentación enviada</span>
          <strong>{submission.documents.length}</strong>
        </div>
        <ul>
          {submission.documents.map((document) => (
            <li key={document.id}>
              <div>
                <strong>{document.name}</strong>
                <span>{(document.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button className="eval-btn eval-btn--outline" type="button" onClick={() => onView(document.id)}>
                Abrir
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="submission-card__annex">
        <span className="submission-card__comment-label">Anexo 11 · Carta de exención</span>
        <strong>{submission.annex11Status === 'completed' ? 'Emitido al enviar la investigación' : 'Pendiente'}</strong>
      </div>

      <div className={`submission-card__classification ${submission.riskLevel ? 'submission-card__classification--done' : ''} ${submission.classificationStatus === 'cancelled' ? 'submission-card__classification--cancelled' : ''}`}>
        <span className="submission-card__comment-label">Estado de estratificación</span>
        <p>{CLASSIFICATION_LABEL[submission.classificationStatus]}</p>
        {submission.riskLevel && (
          <strong>Tu investigación ha sido clasificada como: {RISK_LABEL[submission.riskLevel]}</strong>
        )}
      </div>

      {submission.qualificationStatus && (
        <div className={`submission-card__qualification submission-card__qualification--${submission.qualificationStatus}`}>
          <span className="submission-card__comment-label">Calificación</span>
          <strong>{QUALIFICATION_LABEL[submission.qualificationStatus]}</strong>
          {submission.qualificationObservations && (
            <div className="submission-card__qualification-observations">
              <span>Observaciones del calificador</span>
              <p>{submission.qualificationObservations}</p>
            </div>
          )}
          {submission.qualificationStatus === 'corrections-required' && submission.correctionDueAt && (
            <p className="submission-card__deadline">
              Fecha máxima: {new Date(submission.correctionDueAt).toLocaleDateString('es-EC')}
            </p>
          )}
          {submission.qualificationStatus === 'corrections-required' && (
            <button className="eval-btn eval-btn--primary" onClick={onSubmitCorrections}>
              Subir informe de correcciones
            </button>
          )}
        </div>
      )}

      {isReviewed && (
        <div className="submission-card__result">
          <div className="submission-card__grade">
            <span className="submission-card__grade-label">Calificación</span>
            <span className="submission-card__grade-value">
              {submission.grade?.toFixed(1)} <span className="submission-card__grade-max">/ 10</span>
            </span>
          </div>
          {submission.reviewedAt && (
            <p className="submission-card__review-date">
              Revisado el {formatDateTime(submission.reviewedAt)}
            </p>
          )}
          {submission.finalComment && (
            <div className="submission-card__final-comment">
              <span className="submission-card__comment-label">Comentario del evaluador</span>
              <p className="submission-card__comment-text">{submission.finalComment}</p>
            </div>
          )}
        </div>
      )}

      <div className="submission-card__actions">
        {!isReviewed && canModify && (
          <>
            <button className="eval-btn eval-btn--outline" onClick={onEdit}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Reemplazar documentos
            </button>
            <button className="eval-btn eval-btn--danger-outline" onClick={onDelete}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 4h9M5.5 4V2.5h3V4M6 6.5v4M8 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <rect x="3" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              Retirar investigación
            </button>
          </>
        )}
      </div>
    </div>
  );
}
