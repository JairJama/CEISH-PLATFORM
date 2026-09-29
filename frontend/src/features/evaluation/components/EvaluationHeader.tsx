import type { EvaluationSession, EvaluationStats } from '../types/evaluation.types';

interface Props {
  session: EvaluationSession;
  stats: EvaluationStats;
  isSaving: boolean;
  lastSaved: string | null;
  onSave: () => void;
}

const STATUS_LABEL: Record<EvaluationSession['status'], string> = {
  draft: 'Borrador',
  'in-progress': 'En revisión',
  completed: 'Completado',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EvaluationHeader({ session, stats, isSaving, lastSaved, onSave }: Props) {
  return (
    <header className="eval-header">
      <div className="eval-header__left">
        <div className="eval-header__brand">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="5" fill="#3b82f6" />
            <path
              d="M6 8h10M6 11h10M6 14h6"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="eval-header__brand-name">CEISH</span>
        </div>
        <div className="eval-header__divider" />
        <div className="eval-header__doc-info">
          <p className="eval-header__doc-name" title={session.documentName}>
            {session.documentName}
          </p>
          <div className="eval-header__meta">
            <span className="eval-header__evaluator">{session.evaluator}</span>
            <span className="eval-header__dot">·</span>
            <span className={`eval-header__status eval-header__status--${session.status}`}>
              {STATUS_LABEL[session.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="eval-header__center">
        <div className="eval-header__progress-track">
          <div
            className="eval-header__progress-bar"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
        <span className="eval-header__progress-label">
          {stats.approved + stats.rejected}/{stats.total} revisados
        </span>
      </div>

      <div className="eval-header__right">
        {lastSaved && (
          <span className="eval-header__saved">Guardado {formatTime(lastSaved)}</span>
        )}
        <button className="eval-btn eval-btn--ghost" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
        <button className="eval-btn eval-btn--primary">Finalizar revisión</button>
      </div>
    </header>
  );
}
