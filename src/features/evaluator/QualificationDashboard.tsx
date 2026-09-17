import { useEffect, useState, type FormEvent } from 'react';
import { workflowService, type QualificationTask } from '../../services/workflowService';
import './evaluator.css';

const STATUS_LABEL = {
  'pending-review': 'Pendiente de revisión',
  'corrections-required': 'Esperando correcciones',
  resubmitted: 'Correcciones recibidas',
  approved: 'Aprobada',
  cancelled: 'Cancelada',
  expired: 'Anulada por vencimiento',
} as const;

function QualificationCard({ task, onChanged }: { task: QualificationTask; onChanged: () => Promise<void> }) {
  const [decision, setDecision] = useState<'observations' | 'clear' | null>(null);
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const reviewable = task.status === 'pending-review' || task.status === 'resubmitted';
  const closed = ['approved', 'cancelled', 'expired'].includes(task.status);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decision) {
      setMessage('Indica si existen observaciones.');
      return;
    }
    if (decision === 'observations' && !observations.trim()) {
      setMessage('Describe las observaciones encontradas.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await workflowService.reviewQualification(
        task.id, decision === 'observations', observations,
      );
      setMessage(result.message);
      await onChanged();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('¿Deseas cancelar definitivamente esta investigación?')) return;
    setSaving(true);
    try {
      const result = await workflowService.cancelQualification(task.id);
      setMessage(result.message);
      await onChanged();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openCorrection = async () => {
    try {
      const url = await workflowService.getCorrectionDocumentUrl(task.cycle_id);
      window.open(url, '_blank', 'noopener');
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  };

  return (
    <article className="qualification-card">
      <div className="qualification-card__header">
        <div>
          <span className="qualification-card__cycle">Ciclo {task.current_cycle}</span>
          <h2>{task.document_name}</h2>
          <p>{task.researcher_name} · {task.researcher_email}</p>
        </div>
        <span className={`badge ${task.status === 'approved' ? 'badge--success' : closed ? 'badge--neutral' : 'badge--warning'}`}>
          {STATUS_LABEL[task.status]}
        </span>
      </div>

      {task.status === 'corrections-required' && (
        <div className="qualification-card__notice">
          <strong>Observaciones enviadas</strong>
          <p>{task.observations}</p>
          {task.correction_due_at && <span>Plazo: {new Date(task.correction_due_at).toLocaleDateString('es-EC')}</span>}
        </div>
      )}

      {task.status === 'resubmitted' && task.correction_document_name && (
        <div className="qualification-card__correction">
          <div><strong>Informe recibido</strong><span>{task.correction_document_name}</span></div>
          <button className="eval-btn eval-btn--outline" onClick={() => void openCorrection()}>Ver correcciones</button>
        </div>
      )}

      {reviewable && (
        <form className="qualification-card__form" onSubmit={submitReview}>
          <fieldset disabled={saving}>
            <legend>¿La investigación tiene observaciones?</legend>
            <label>
              <input type="radio" name={`decision-${task.id}`} checked={decision === 'observations'} onChange={() => setDecision('observations')} />
              Sí, tiene observaciones
            </label>
            <label>
              <input type="radio" name={`decision-${task.id}`} checked={decision === 'clear'} onChange={() => setDecision('clear')} />
              No tiene observaciones
            </label>
          </fieldset>
          {decision === 'observations' && (
            <label className="qualification-card__observations">
              Observaciones
              <textarea
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                rows={4}
                placeholder="Detalla las correcciones que debe realizar el investigador..."
                disabled={saving}
              />
            </label>
          )}
          <button className="eval-btn eval-btn--primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar revisión'}
          </button>
        </form>
      )}

      <div className="qualification-card__actions">
        <button
          className="eval-btn eval-btn--outline"
          onClick={() => window.open(`/api/documents/${task.submission_id}/raw`, '_blank', 'noopener')}
        >
          Ver investigación
        </button>
        {!closed && (
          <button className="eval-btn eval-btn--danger-outline" disabled={saving} onClick={() => void cancel()}>
            Cancelar investigación
          </button>
        )}
      </div>
      {message && <p className="qualification-card__message" role="status">{message}</p>}
    </article>
  );
}

export function QualificationDashboard() {
  const [tasks, setTasks] = useState<QualificationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setTasks(await workflowService.getQualificationTasks());
  };

  useEffect(() => {
    void workflowService.getQualificationTasks()
      .then(setTasks)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  const openCount = tasks.filter((task) => !['approved', 'cancelled', 'expired'].includes(task.status)).length;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Calificación de investigaciones</h1>
          <p className="page__subtitle">{openCount} investigaciones activas</p>
        </div>
      </div>
      <div className="page__body">
        {error && <div className="workflow-alert workflow-alert--error" role="alert">{error}</div>}
        {loading ? (
          <div className="page__loading"><div className="pdf-spinner" /><span>Cargando...</span></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No tienes investigaciones para calificar</p>
            <p className="empty-state__desc">Las investigaciones clasificadas sin riesgo aparecerán aquí.</p>
          </div>
        ) : (
          <div className="qualification-list">
            {tasks.map((task) => <QualificationCard key={`${task.id}-${task.updated_at}`} task={task} onChanged={reload} />)}
          </div>
        )}
      </div>
    </div>
  );
}
