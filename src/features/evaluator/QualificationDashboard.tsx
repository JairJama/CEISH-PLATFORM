import { useEffect, useState, type FormEvent } from 'react';
import {
  ANNEX_12_SECTIONS,
  type Annex12ChecklistItem,
  type Annex12CriterionResult,
} from '../../shared/annex12';
import { workflowService, type QualificationAnnex, type QualificationTask } from '../../services/workflowService';
import './evaluator.css';

const STATUS_LABEL = {
  'pending-review': 'Pendiente de revisión',
  'corrections-required': 'Esperando correcciones',
  resubmitted: 'Correcciones recibidas',
  approved: 'Aprobada',
  cancelled: 'Cerrada por el evaluador',
  expired: 'Anulada por vencimiento',
} as const;

type Decision = 'approved' | 'corrections-required' | 'cancelled';
type DraftChecklistItem = Annex12ChecklistItem;

function createDraftChecklist(): DraftChecklistItem[] {
  return ANNEX_12_SECTIONS.flatMap((section) => section.criteria.map((criterion) => ({
    ...criterion,
    component: section.component,
    result: 'does-not-comply',
    observations: '',
  })));
}

function annexDecisionLabel(decision: string | null): string {
  if (decision === 'approved') return 'Sin observaciones';
  if (decision === 'cancelled') return 'Con observaciones · caso cerrado';
  if (decision === 'corrections-required') return 'Con observaciones';
  return 'Documento emitido';
}

function QualificationCard({ task, onChanged }: { task: QualificationTask; onChanged: () => Promise<void> }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [observations, setObservations] = useState('');
  const [checklist, setChecklist] = useState<DraftChecklistItem[]>(createDraftChecklist);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const reviewable = task.status === 'pending-review' || task.status === 'resubmitted';
  const closed = ['approved', 'cancelled', 'expired'].includes(task.status);
  const compliantCriteria = checklist.filter((item) => item.result === 'complies').length;

  const updateCriterion = (id: string, update: Partial<Pick<DraftChecklistItem, 'result' | 'observations'>>) => {
    setChecklist((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decision) {
      setMessage('Selecciona el resultado de la evaluación.');
      return;
    }
    const hasRejectedCriterion = checklist.some((item) => item.result === 'does-not-comply');
    if (decision === 'approved' && hasRejectedCriterion) {
      setMessage('No puedes aprobar mientras existan criterios marcados como “No cumple”.');
      return;
    }
    if (decision !== 'approved' && (!hasRejectedCriterion || !observations.trim())) {
      setMessage('Marca al menos un criterio como “No cumple” y describe las observaciones.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await workflowService.reviewQualification(
        task.id,
        decision,
        observations,
        checklist as Annex12ChecklistItem[],
      );
      setMessage(result.message);
      setDecision(null);
      setObservations('');
      setChecklist(createDraftChecklist());
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

  const openAnnex = async (annex: QualificationAnnex, download: boolean) => {
    try {
      const document = await workflowService.getAnnexDocumentUrl(annex.id);
      if (download) {
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = document.documentName;
        link.rel = 'noopener';
        link.click();
      } else {
        window.open(document.url, '_blank', 'noopener');
      }
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
          <div className="annex-12-heading">
            <div><span>Anexo 12</span><strong>Checklist de evaluación del proyecto</strong></div>
            <small>{compliantCriteria} de {checklist.length} criterios cumplen</small>
          </div>

          <div className="annex-12-checklist">
            {ANNEX_12_SECTIONS.map((section) => (
              <section className="annex-12-section" key={section.component}>
                <h3>
                  <span>{section.component}</span>
                  <small>{section.criteria.length} {section.criteria.length === 1 ? 'criterio' : 'criterios'}</small>
                </h3>
                {section.criteria.map((criterion) => {
                  const item = checklist.find((current) => current.id === criterion.id)!;
                  return (
                    <div className="annex-12-criterion" key={criterion.id}>
                      <p>{criterion.characteristic}</p>
                      <label className="annex-12-criterion__check">
                        <input
                          type="checkbox"
                          checked={item.result === 'complies'}
                          onChange={(event) => updateCriterion(criterion.id, {
                            result: event.target.checked ? 'complies' : 'does-not-comply',
                          })}
                          disabled={saving}
                        />
                        <span>Cumple</span>
                        <small>Sin marca: no cumple</small>
                      </label>
                      <label>
                        Observación del criterio
                        <input
                          value={item.observations}
                          onChange={(event) => updateCriterion(criterion.id, { observations: event.target.value })}
                          placeholder="Opcional"
                          disabled={saving}
                        />
                      </label>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>

          <fieldset disabled={saving}>
            <legend>Resultado de esta evaluación</legend>
            <label>
              <input type="radio" name={`decision-${task.id}`} checked={decision === 'corrections-required'} onChange={() => setDecision('corrections-required')} />
              Emitir Anexo 12 con observaciones y solicitar correcciones
            </label>
            <label>
              <input type="radio" name={`decision-${task.id}`} checked={decision === 'approved'} onChange={() => setDecision('approved')} />
              Emitir Anexo 12 sin observaciones y Anexo 11 de aprobación
            </label>
            {task.status === 'resubmitted' && (
              <label>
              <input type="radio" name={`decision-${task.id}`} checked={decision === 'cancelled'} onChange={() => setDecision('cancelled')} />
                Emitir Anexo 12 con observaciones y Anexo 13 para cerrar el caso
              </label>
            )}
          </fieldset>
          {decision && decision !== 'approved' && (
            <label className="qualification-card__observations">
              Observaciones generales
              <textarea
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                rows={4}
                placeholder="Detalla las correcciones pendientes y su fundamento..."
                disabled={saving}
              />
            </label>
          )}
          <button className="eval-btn eval-btn--primary" type="submit" disabled={saving}>
            {saving ? 'Emitiendo anexos...' : 'Registrar evaluación y emitir anexos'}
          </button>
        </form>
      )}

      {(task.annexes ?? []).length > 0 && (
        <section className="qualification-annex-history" aria-label="Historial de anexos de evaluación">
          <div><strong>Historial documental</strong><span>{task.annexes.length} anexos emitidos</span></div>
          <ol>
            {task.annexes.map((annex) => (
              <li key={annex.id}>
                <div>
                  <strong>Anexo {annex.annexNumber}{annex.revisionNumber ? ` · Revisión ${annex.revisionNumber}` : ''}</strong>
                  <span>{annexDecisionLabel(annex.decision)} · {new Date(annex.createdAt).toLocaleString('es-EC')}</span>
                </div>
                <div>
                  <button className="eval-btn eval-btn--outline" type="button" onClick={() => void openAnnex(annex, false)}>Visualizar</button>
                  <button className="eval-btn eval-btn--primary" type="button" onClick={() => void openAnnex(annex, true)}>Descargar</button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="qualification-card__actions">
        <button className="eval-btn eval-btn--outline" onClick={() => window.open(`/api/documents/${task.submission_id}/raw`, '_blank', 'noopener')}>
          Ver investigación
        </button>
      </div>
      {message && <p className="qualification-card__message" role="status">{message}</p>}
    </article>
  );
}

export function QualificationDashboard() {
  const [tasks, setTasks] = useState<QualificationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => setTasks(await workflowService.getQualificationTasks());

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
