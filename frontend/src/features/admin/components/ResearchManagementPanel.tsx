import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../../shared/types/platform.types';
import { workflowService, type AdminResearchItem } from '../../../services/workflowService';
import { badgeClass, btnClass, pageLayout, spinnerClass } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

const STATUS_LABEL: Record<string, string> = {
  'awaiting-assignment': 'Sin estratificador',
  'awaiting-first': 'Pendiente de estratificación',
  'awaiting-second': 'Pendiente de segundo dictamen',
  'awaiting-consensus': 'Esperando consenso',
  classified: 'Clasificada',
  cancelled: 'Cancelada',
};

export function ResearchRow({
  research,
  members,
  onChanged,
}: {
  research: AdminResearchItem;
  members: User[];
  onChanged: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canReassign = research.classification_status === 'awaiting-first' && !research.stratification_decided_at;
  const canReassignQualifier = Boolean(research.qualifier_id)
    && !['approved', 'cancelled', 'expired'].includes(research.qualification_status ?? '');
  const canCancel = research.classification_status !== 'cancelled' && research.qualification_status !== 'approved';

  const reassign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stratifierId = new FormData(event.currentTarget).get('stratifierId') as string | null;
    if (!stratifierId || stratifierId === research.stratifier_id) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await workflowService.reassignStratifier(research.submission_id, stratifierId);
      setMessage(result.message);
      await onChanged();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('¿Deseas cancelar esta investigación? Esta acción cerrará cualquier flujo activo.')) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await workflowService.cancelResearch(research.submission_id);
      setMessage(result.message);
      await onChanged();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reassignQualifier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const qualifierId = new FormData(event.currentTarget).get('qualifierId') as string | null;
    if (!qualifierId || qualifierId === research.qualifier_id) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await workflowService.reassignQualifier(research.submission_id, qualifierId);
      setMessage(result.message);
      await onChanged();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openAnnex = async (annexId: string, download: boolean) => {
    setMessage(null);
    try {
      const document = await workflowService.getAnnexDocumentUrl(annexId);
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
    <article className="flex flex-col gap-3.5 p-5 border border-slate-200 rounded-xl bg-white shadow-xs">
      <div className="flex items-start justify-between gap-3.5 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{research.document_name}</h2>
          <p className="mt-1 text-[12px] text-slate-500">{research.researcher_name} · {research.researcher_email}</p>
        </div>
        <span className={badgeClass(research.classification_status === 'cancelled' ? 'neutral' : 'info')}>
          {STATUS_LABEL[research.classification_status] ?? research.classification_status}
        </span>
      </div>

      <div className="grid gap-3.5">
        <div className="flex flex-wrap gap-3 py-2 border-b border-slate-200 text-[11px]">
          <span className={cn(research.classification_status === 'awaiting-first' ? 'text-[#ef3e3a] font-semibold' : 'text-slate-500')}>
            1. Estratificación
          </span>
          <span className={cn(research.classification_status === 'classified' ? 'text-[#ef3e3a] font-semibold' : 'text-slate-500')}>
            2. Evaluación
          </span>
          <span className={cn(research.qualification_status === 'approved' ? 'text-[#ef3e3a] font-semibold' : 'text-slate-500')}>
            3. Dictamen
          </span>
        </div>

        <div className="flex flex-col gap-1 px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-[12px] text-slate-500">
          <span>Estratificador asignado</span>
          {research.stratifier_name ? (
            <strong className="text-[13px] text-slate-900">
              {research.stratifier_name}{' '}
              <small className="ml-1 text-[11px] font-normal text-slate-500">{research.stratifier_email}</small>
            </strong>
          ) : (
            <strong className="text-[13px] text-slate-900">Sin asignación disponible</strong>
          )}
        </div>

        {canReassign ? (
          <form className="flex items-end flex-wrap gap-2.5" onSubmit={reassign}>
            <label className="flex flex-1 flex-col gap-1.5 min-w-[230px] text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em]">
              Cambiar a miembro CEISH
              <select
                className="h-[38px] px-2.5 border border-slate-300 rounded-md bg-white text-slate-900 text-[13px] font-normal normal-case tracking-normal outline-none focus:border-[#ef3e3a]"
                name="stratifierId"
                defaultValue={research.stratifier_id ?? ''}
                disabled={saving}
              >
                {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.email}</option>)}
              </select>
            </label>
            <button className={btnClass('outline')} type="submit" disabled={saving}>
              Reasignar
            </button>
          </form>
        ) : (
          <p className="text-[12px] text-slate-500">
            {research.classification_status === 'cancelled'
              ? 'La investigación está cancelada.'
              : 'La reasignación se bloqueó porque la estratificación ya inició.'}
          </p>
        )}

        {research.qualifier_id && (
          <div className="flex flex-col gap-1 px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-[12px] text-slate-500">
            <span>Evaluador asignado</span>
            <strong className="text-[13px] text-slate-900">
              {research.qualifier_name}{' '}
              <small className="ml-1 text-[11px] font-normal text-slate-500">{research.qualifier_email}</small>
            </strong>
          </div>
        )}
        {canReassignQualifier && (
          <form className="flex items-end flex-wrap gap-2.5" onSubmit={reassignQualifier}>
            <label className="flex flex-1 flex-col gap-1.5 min-w-[230px] text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em]">
              Cambiar evaluador CEISH
              <select
                className="h-[38px] px-2.5 border border-slate-300 rounded-md bg-white text-slate-900 text-[13px] font-normal normal-case tracking-normal outline-none focus:border-[#ef3e3a]"
                name="qualifierId"
                defaultValue={research.qualifier_id ?? ''}
                disabled={saving}
              >
                {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.email}</option>)}
              </select>
            </label>
            <button className={btnClass('outline')} type="submit" disabled={saving}>Reasignar evaluador</button>
          </form>
        )}

        <div className="flex flex-wrap gap-2 pt-0.5">
          <button
            className={btnClass('outline')}
            onClick={() => window.open(`/api/documents/${research.submission_id}/raw`, '_blank', 'noopener')}
            type="button"
          >
            Ver investigación
          </button>
          {canCancel && (
            <button className={btnClass('dangerOutline')} disabled={saving} onClick={() => void cancel()} type="button">
              Cancelar investigación
            </button>
          )}
        </div>

        {research.annexes.length > 0 && (
          <aside className="mt-1 pt-3.5 border-t border-slate-200 grid gap-2 text-[13px]" aria-label="Anexos generados">
            <strong className="text-slate-800">Anexos Word generados</strong>
            <ul className="grid gap-1.5 list-none m-0 p-0">
              {research.annexes.map((annex) => (
                <li
                  key={annex.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 rounded-md border border-slate-200 bg-slate-50"
                >
                  <span className="text-slate-700">
                    Anexo {annex.annexNumber}
                    {annex.revisionNumber ? ` · Revisión ${annex.revisionNumber}` : ''}
                    {annex.createdAt ? ` · ${new Date(annex.createdAt).toLocaleDateString('es-EC')}` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className={btnClass('outline', 'min-h-[28px] px-2.5 py-1')} type="button" onClick={() => void openAnnex(annex.id, false)}>
                      {annex.documentReady ? 'Visualizar' : 'Generar y visualizar'}
                    </button>
                    <button className={btnClass('primary', 'min-h-[28px] px-2.5 py-1')} type="button" onClick={() => void openAnnex(annex.id, true)}>
                      Descargar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
        {message && <p className="text-[12px] text-slate-600" role="status">{message}</p>}
      </div>
    </article>
  );
}

export function ResearchFolderCard({ research }: { research: AdminResearchItem }) {
  const status = STATUS_LABEL[research.classification_status] ?? research.classification_status;
  const phase = research.classification_status === 'classified' ? 'Evaluación ética' : 'Estratificación';
  return (
    <Link
      className="relative flex min-h-[265px] flex-col pt-[21px] px-[19px] pb-[17px] border border-slate-200 rounded-[10px] bg-white shadow-xs text-inherit no-underline transition-all duration-200 hover:-translate-y-1 hover:border-red-300 hover:shadow-lg before:content-[''] before:absolute before:-top-px before:left-[18px] before:w-[68px] before:h-1 before:rounded-b before:bg-[#ef3e3a]"
      to={`/admin/investigaciones/${research.submission_id}`}
    >
      <div className="text-slate-400 text-[9px] font-extrabold tracking-[0.1em]">
        EXPEDIENTE · {research.submission_id.slice(0, 8).toUpperCase()}
      </div>
      <div className="grid w-12 h-[42px] mt-5 mb-3 place-items-center border border-red-200 rounded-lg bg-red-50 text-[#ef3e3a] text-[22px]" aria-hidden="true">
        ▤
      </div>
      <span className="absolute top-[18px] right-[15px] px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-semibold">
        {status}
      </span>
      <h2 className="line-clamp-2 m-0 text-slate-900 text-[15px] font-semibold leading-snug">
        {research.document_name}
      </h2>
      <p className="mt-1.5 mb-4 text-slate-500 text-[11px]">{research.researcher_name}</p>
      <div className="flex justify-between mt-auto py-2.5 border-t border-slate-200 text-slate-500 text-[10px]">
        <span>{phase}</span>
        <span>{research.annexes.length} documentos</span>
      </div>
      <span className="flex justify-between items-center pt-2.5 text-[#d92f2c] text-[11px] font-bold">
        Abrir expediente <b className="text-[16px]">→</b>
      </span>
    </Link>
  );
}

export function ResearchManagementPanel() {
  const [research, setResearch] = useState<AdminResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void workflowService.getAdminResearch()
      .then((researchData) => {
        setResearch(researchData);
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Investigaciones y estratificación</h1>
          <p className={pageLayout.subtitle}>Supervisa asignaciones, reasigna antes del dictamen o cancela investigaciones</p>
        </div>
      </div>
      <div className={pageLayout.body}>
        {error && <div className={pageLayout.alertError} role="alert">{error}</div>}
        {loading ? (
          <div className={pageLayout.loading}>
            <div className={spinnerClass} />
            <span>Cargando...</span>
          </div>
        ) : research.length === 0 ? (
          <div className={pageLayout.emptyState}>
            <p className={pageLayout.emptyTitle}>No hay investigaciones enviadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-[18px] items-stretch">
            {research.map((item) => <ResearchFolderCard key={item.submission_id} research={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}
