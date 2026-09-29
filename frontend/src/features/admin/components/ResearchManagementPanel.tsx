import { useEffect, useState, type FormEvent } from 'react';
import { platformService } from '../../../shared/services/platformService';
import type { User } from '../../../shared/types/platform.types';
import { workflowService, type AdminResearchItem } from '../../../services/workflowService';
import '../admin.css';

const STATUS_LABEL: Record<string, string> = {
  'awaiting-assignment': 'Sin estratificador',
  'awaiting-first': 'Pendiente de estratificación',
  'awaiting-second': 'Pendiente de segundo dictamen',
  'awaiting-consensus': 'Esperando consenso',
  classified: 'Clasificada',
  cancelled: 'Cancelada',
};

function ResearchRow({
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
    <article className="research-management-card">
      <div className="research-management-card__header">
        <div>
          <h2>{research.document_name}</h2>
          <p>{research.researcher_name} · {research.researcher_email}</p>
        </div>
        <span className={`badge ${research.classification_status === 'cancelled' ? 'badge--neutral' : 'badge--info'}`}>
          {STATUS_LABEL[research.classification_status] ?? research.classification_status}
        </span>
      </div>

      <div className="research-management-card__assignment">
        <span>Estratificador asignado</span>
        {research.stratifier_name ? (
          <strong>{research.stratifier_name} <small>{research.stratifier_email}</small></strong>
        ) : <strong>Sin asignación disponible</strong>}
      </div>

      {canReassign ? (
        <form className="research-management-card__reassign" onSubmit={reassign}>
          <label>
            Cambiar a miembro CEISH
            <select name="stratifierId" defaultValue={research.stratifier_id ?? ''} disabled={saving}>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.email}</option>)}
            </select>
          </label>
          <button className="eval-btn eval-btn--outline" type="submit" disabled={saving}>
            Reasignar
          </button>
        </form>
      ) : (
        <p className="research-management-card__locked">
          {research.classification_status === 'cancelled'
            ? 'La investigación está cancelada.'
            : 'La reasignación se bloqueó porque la estratificación ya inició.'}
        </p>
      )}

      {research.qualifier_id && (
        <div className="research-management-card__assignment">
          <span>Evaluador asignado</span>
          <strong>{research.qualifier_name} <small>{research.qualifier_email}</small></strong>
        </div>
      )}
      {canReassignQualifier && (
        <form className="research-management-card__reassign" onSubmit={reassignQualifier}>
          <label>
            Cambiar evaluador CEISH
            <select name="qualifierId" defaultValue={research.qualifier_id ?? ''} disabled={saving}>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.email}</option>)}
            </select>
          </label>
          <button className="eval-btn eval-btn--outline" type="submit" disabled={saving}>Reasignar evaluador</button>
        </form>
      )}

      <div className="research-management-card__actions">
        <button
          className="eval-btn eval-btn--outline"
          onClick={() => window.open(`/api/documents/${research.submission_id}/raw`, '_blank', 'noopener')}
        >
          Ver investigación
        </button>
        {canCancel && (
          <button className="eval-btn eval-btn--danger-outline" disabled={saving} onClick={() => void cancel()}>
            Cancelar investigación
          </button>
        )}
      </div>
      {research.annexes.length > 0 && (
        <section className="research-management-card__annexes" aria-label="Anexos generados">
          <strong>Anexos Word generados</strong>
          <ul>
            {research.annexes.map((annex) => (
              <li key={annex.id}>
                <span>
                  Anexo {annex.annexNumber}
                  {annex.revisionNumber ? ` · Revisión ${annex.revisionNumber}` : ''}
                  {annex.createdAt ? ` · ${new Date(annex.createdAt).toLocaleDateString('es-EC')}` : ''}
                </span>
                <div>
                  <button className="eval-btn eval-btn--outline" type="button" onClick={() => void openAnnex(annex.id, false)}>
                    {annex.documentReady ? 'Visualizar' : 'Generar y visualizar'}
                  </button>
                  <button className="eval-btn eval-btn--primary" type="button" onClick={() => void openAnnex(annex.id, true)}>
                    Descargar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {message && <p className="research-management-card__message" role="status">{message}</p>}
    </article>
  );
}

export function ResearchManagementPanel() {
  const [research, setResearch] = useState<AdminResearchItem[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const data = await workflowService.getAdminResearch();
    setResearch(data);
  };

  useEffect(() => {
    void Promise.all([workflowService.getAdminResearch(), platformService.getUsers()])
      .then(([researchData, users]) => {
        setResearch(researchData);
        setMembers(users.filter((user) => user.role === 'evaluator'));
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Investigaciones y estratificación</h1>
          <p className="page__subtitle">Supervisa asignaciones, reasigna antes del dictamen o cancela investigaciones</p>
        </div>
      </div>
      <div className="page__body">
        {error && <div className="workflow-alert workflow-alert--error" role="alert">{error}</div>}
        {loading ? (
          <div className="page__loading"><div className="pdf-spinner" /><span>Cargando...</span></div>
        ) : research.length === 0 ? (
          <div className="empty-state"><p className="empty-state__title">No hay investigaciones enviadas</p></div>
        ) : (
          <div className="research-management-list">
            {research.map((item) => <ResearchRow key={item.submission_id} research={item} members={members} onChanged={reload} />)}
          </div>
        )}
      </div>
    </div>
  );
}
