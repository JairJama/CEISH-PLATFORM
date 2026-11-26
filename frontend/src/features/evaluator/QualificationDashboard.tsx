import { useEffect, useState, type FormEvent } from 'react';
import {
  ANNEX_12_SECTIONS,
  type Annex12ChecklistItem,
} from '../../shared/annex12';
import { workflowService, type QualificationAnnex, type QualificationTask } from '../../services/workflowService';
import { badgeClass, btnClass, pageLayout, spinnerClass } from '../../shared/components/common/ui';

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
    <details className="group open:col-span-full relative flex flex-col gap-3.5 p-[18px] bg-white border border-slate-200 rounded-[9px] shadow-xs">
      <summary className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 pb-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div>
          <span className="text-[10px] font-bold text-[#ef3e3a] uppercase tracking-[0.08em]">
            Ciclo {task.current_cycle}
          </span>
          <h2 className="mt-1 text-[16px] font-semibold text-slate-900">{task.document_name}</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">{task.researcher_name} · {task.researcher_email}</p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-start">
          <span className={badgeClass(task.status === 'approved' ? 'success' : closed ? 'neutral' : 'warning')}>
            {STATUS_LABEL[task.status]}
          </span>
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            <span className="group-open:hidden">Abrir carpeta ›</span>
            <span className="hidden group-open:inline">Cerrar carpeta ‹</span>
          </span>
        </div>
      </summary>

      <div className="flex flex-col gap-3.5 pt-3.5 border-t border-slate-200">
        {task.status === 'corrections-required' && (
          <div className="flex flex-col gap-1.5 p-3 bg-amber-50 border border-amber-200 rounded-md text-[13px] text-amber-900">
            <strong>Observaciones enviadas</strong>
            <p>{task.observations}</p>
            {task.correction_due_at && (
              <span className="text-[11px]">Plazo: {new Date(task.correction_due_at).toLocaleDateString('es-EC')}</span>
            )}
          </div>
        )}

        {task.status === 'resubmitted' && task.correction_document_name && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3 bg-red-50/70 border border-red-200 rounded-md">
            <div className="flex flex-col gap-0.5 text-[13px] text-slate-800">
              <strong>Informe recibido</strong>
              <span className="text-[12px] text-slate-600">{task.correction_document_name}</span>
            </div>
            <button className={btnClass('outline')} onClick={() => void openCorrection()} type="button">
              Ver correcciones
            </button>
          </div>
        )}

        {reviewable && (
          <form className="flex flex-col items-start gap-3" onSubmit={submitReview}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 w-full pb-2.5 border-b border-slate-200">
              <div className="flex flex-col gap-0.5">
                <span className="text-[#ef3e3a] text-[10px] font-extrabold tracking-[0.1em] uppercase">Anexo 12</span>
                <strong className="text-slate-900 text-[14px]">Checklist de evaluación del proyecto</strong>
              </div>
              <small className="text-slate-500 text-[11px]">
                {compliantCriteria} de {checklist.length} criterios cumplen
              </small>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {ANNEX_12_SECTIONS.map((section) => (
                <section className="overflow-hidden border border-slate-200 rounded-md bg-white" key={section.component}>
                  <h3 className="flex items-center justify-between gap-3 px-3 py-2.5 bg-red-50/80 border-b border-red-200 text-[#d92f2c] text-[11px] font-bold tracking-[0.04em] uppercase">
                    <span>{section.component}</span>
                    <small className="text-slate-500 text-[10px] font-semibold tracking-normal normal-case">
                      {section.criteria.length} {section.criteria.length === 1 ? 'criterio' : 'criterios'}
                    </small>
                  </h3>
                  {section.criteria.map((criterion) => {
                    const item = checklist.find((current) => current.id === criterion.id)!;
                    return (
                      <div
                        className="grid grid-cols-1 md:grid-cols-[minmax(240px,1.35fr)_minmax(150px,0.5fr)_minmax(220px,1fr)] items-center gap-3.5 px-3.5 py-3 border-t border-slate-200 first-of-type:border-t-0"
                        key={criterion.id}
                      >
                        <p className="text-slate-700 text-[12px] leading-snug">{criterion.characteristic}</p>
                        <label className="flex flex-col gap-1 items-start justify-center min-h-[56px] px-3 py-2.5 border border-slate-200 rounded bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.result === 'complies'}
                            onChange={(event) => updateCriterion(criterion.id, {
                              result: event.target.checked ? 'complies' : 'does-not-comply',
                            })}
                            disabled={saving}
                            className="w-[17px] h-[17px] mb-0.5 accent-[#ef3e3a]"
                          />
                          <span className="text-slate-800 text-[12px] font-semibold">Cumple</span>
                          <small className="text-slate-500 text-[10px] font-medium">Sin marca: no cumple</small>
                        </label>
                        <label className="flex flex-col gap-1 text-slate-500 text-[10px] font-bold tracking-[0.04em] uppercase">
                          Observación del criterio
                          <input
                            className="w-full h-9 px-2.5 border border-slate-300 rounded bg-white text-slate-900 text-[12px] font-normal tracking-normal normal-case outline-none transition focus:border-[#ef3e3a] focus:ring-2 focus:ring-[#ef3e3a]/15"
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

            <fieldset className="flex flex-wrap gap-2 m-0 p-0 border-0 w-full" disabled={saving}>
              <legend className="w-full mb-1.5 text-[12px] font-bold text-slate-800">
                Resultado de esta evaluación
              </legend>
              <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md bg-white text-[12px] text-slate-700 cursor-pointer hover:border-slate-400">
                <input
                  type="radio"
                  name={`decision-${task.id}`}
                  checked={decision === 'corrections-required'}
                  onChange={() => setDecision('corrections-required')}
                  className="accent-[#ef3e3a]"
                />
                Emitir Anexo 12 con observaciones y solicitar correcciones
              </label>
              <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md bg-white text-[12px] text-slate-700 cursor-pointer hover:border-slate-400">
                <input
                  type="radio"
                  name={`decision-${task.id}`}
                  checked={decision === 'approved'}
                  onChange={() => setDecision('approved')}
                  className="accent-[#ef3e3a]"
                />
                Emitir Anexo 12 sin observaciones y Anexo 11 de aprobación
              </label>
              {task.status === 'resubmitted' && (
                <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md bg-white text-[12px] text-slate-700 cursor-pointer hover:border-slate-400">
                  <input
                    type="radio"
                    name={`decision-${task.id}`}
                    checked={decision === 'cancelled'}
                    onChange={() => setDecision('cancelled')}
                    className="accent-[#ef3e3a]"
                  />
                  Emitir Anexo 12 con observaciones y Anexo 13 para cerrar el caso
                </label>
              )}
            </fieldset>

            {decision && decision !== 'approved' && (
              <label className="flex flex-col gap-1.5 w-full max-w-[680px] text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em]">
                Observaciones generales
                <textarea
                  className="w-full px-3 py-2.5 resize-y border border-slate-300 rounded-md bg-white text-slate-900 text-[13px] font-normal leading-normal normal-case tracking-normal outline-none focus:border-[#ef3e3a] focus:ring-2 focus:ring-[#ef3e3a]/15"
                  value={observations}
                  onChange={(event) => setObservations(event.target.value)}
                  rows={4}
                  placeholder="Detalla las correcciones pendientes y su fundamento..."
                  disabled={saving}
                />
              </label>
            )}

            <button className={btnClass('primary')} type="submit" disabled={saving}>
              {saving ? 'Emitiendo anexos...' : 'Registrar evaluación y emitir anexos'}
            </button>
          </form>
        )}

        {(task.annexes ?? []).length > 0 && (
          <section
            className="flex flex-col gap-2.5 p-3.5 border border-red-200 rounded-md bg-red-50/50"
            aria-label="Historial de anexos de evaluación"
          >
            <div className="flex items-center justify-between gap-3">
              <strong className="text-slate-800 text-[12px]">Historial documental</strong>
              <span className="text-slate-500 text-[11px]">{task.annexes.length} anexos emitidos</span>
            </div>
            <ol className="flex flex-col gap-2 list-none m-0 p-0">
              {task.annexes.map((annex) => (
                <li
                  key={annex.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-red-200/80"
                >
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-slate-900 text-[12px]">
                      Anexo {annex.annexNumber}{annex.revisionNumber ? ` · Revisión ${annex.revisionNumber}` : ''}
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      {annexDecisionLabel(annex.decision)} · {new Date(annex.createdAt).toLocaleString('es-EC')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button className={btnClass('outline', 'min-h-[28px] px-2.5 py-1')} type="button" onClick={() => void openAnnex(annex, false)}>
                      Visualizar
                    </button>
                    <button className={btnClass('primary', 'min-h-[28px] px-2.5 py-1')} type="button" onClick={() => void openAnnex(annex, true)}>
                      Descargar
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200">
          <button
            className={btnClass('outline')}
            onClick={() => window.open(`/api/documents/${task.submission_id}/raw`, '_blank', 'noopener')}
            type="button"
          >
            Ver investigación
          </button>
        </div>
        {message && <p className="text-[12px] text-slate-600" role="status">{message}</p>}
      </div>
    </details>
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
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Calificación de investigaciones</h1>
          <p className={pageLayout.subtitle}>{openCount} investigaciones activas</p>
        </div>
      </div>
      <div className={pageLayout.body}>
        {error && <div className={pageLayout.alertError} role="alert">{error}</div>}
        {loading ? (
          <div className={pageLayout.loading}>
            <div className={spinnerClass} />
            <span>Cargando...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className={pageLayout.emptyState}>
            <p className={pageLayout.emptyTitle}>No tienes investigaciones para calificar</p>
            <p className={pageLayout.emptyDesc}>Las investigaciones clasificadas sin riesgo aparecerán aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[repeat(auto-fit,minmax(430px,1fr))] items-start gap-3.5">
            {tasks.map((task) => <QualificationCard key={`${task.id}-${task.updated_at}`} task={task} onChanged={reload} />)}
          </div>
        )}
      </div>
    </div>
  );
}
