import { useEffect, useState, type FormEvent } from 'react';
import {
  workflowService,
  type Annex27Payload,
  type NoRiskCriterion,
  type StratificationTask,
} from '../../services/workflowService';
import { storageService } from '../../services/storage';
import './evaluator.css';

const NO_RISK_INDICATORS = [
  'No se realiza sobre seres humanos, sus datos o muestras biológicas.',
  'Utiliza únicamente datos abiertos o públicos.',
  'Analiza datos consolidados o bases anonimizadas obtenidas de registros existentes.',
  'Revisa políticas públicas o reglamentación.',
  'Utiliza fuentes secundarias de literatura científica.',
  'Evalúa anónimamente sabor, calidad de alimentos o aceptación del consumidor.',
  'Evalúa anónimamente programas públicos o prácticas educativas.',
  'Recopila información anónima sin datos identificativos, sensibles ni población vulnerable.',
] as const;

function createCriteria(saved?: NoRiskCriterion[]): NoRiskCriterion[] {
  return NO_RISK_INDICATORS.map((indicator, index) => ({
    indicator,
    answer: saved?.[index]?.answer ?? 'no',
    observations: saved?.[index]?.observations ?? '',
  }));
}

function annexValue(data: Record<string, unknown> | null, key: string): string {
  const value = data?.[key];
  return typeof value === 'string' ? value : '';
}

function Annex11Editor({ task, onSaved }: { task: StratificationTask; onSaved: () => Promise<void> }) {
  const [officeNumber, setOfficeNumber] = useState(annexValue(task.annex_11_data, 'officeNumber'));
  const [issueDate, setIssueDate] = useState(annexValue(task.annex_11_data, 'issueDate'));
  const [studyType, setStudyType] = useState(annexValue(task.annex_11_data, 'studyType'));
  const [durationMonths, setDurationMonths] = useState(annexValue(task.annex_11_data, 'durationMonths'));
  const [participatingInstitutions, setParticipatingInstitutions] = useState(annexValue(task.annex_11_data, 'participatingInstitutions'));
  const [studyResearchers, setStudyResearchers] = useState(
    annexValue(task.annex_11_data, 'studyResearchers') || task.researcher_name,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await workflowService.updateAnnex11(task.id, {
        officeNumber,
        issueDate,
        studyType,
        durationMonths,
        participatingInstitutions,
        studyResearchers,
      });
      setMessage(result.message);
      await onSaved();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="annex-editor">
      <summary>Preparar datos del Anexo 11</summary>
      <form className="annex-form annex-form--compact" onSubmit={save}>
        <div className="annex-form__heading">
          <span>Anexo 11</span>
          <div>
            <h3>Resolución de aprobación</h3>
            <p>Estos datos se conservarán como borrador y el Anexo 11 se emitirá al aprobar la investigación.</p>
          </div>
        </div>
        <div className="annex-form__grid">
          <label className="annex-form__field"><span>Número de oficio</span><input value={officeNumber} onChange={(event) => setOfficeNumber(event.target.value)} /></label>
          <label className="annex-form__field"><span>Fecha de emisión</span><input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></label>
          <label className="annex-form__field"><span>Tipo de estudio</span><input value={studyType} onChange={(event) => setStudyType(event.target.value)} /></label>
          <label className="annex-form__field"><span>Duración en meses</span><input type="number" min="0" value={durationMonths} onChange={(event) => setDurationMonths(event.target.value)} /></label>
          <label className="annex-form__field"><span>Instituciones participantes</span><input value={participatingInstitutions} onChange={(event) => setParticipatingInstitutions(event.target.value)} /></label>
          <label className="annex-form__field"><span>Investigadores del estudio</span><input value={studyResearchers} onChange={(event) => setStudyResearchers(event.target.value)} /></label>
        </div>
        <button className="eval-btn eval-btn--outline" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Anexo 11'}</button>
        {message && <p className="stratification-card__message" role="status">{message}</p>}
      </form>
    </details>
  );
}

function AnnexDocumentActions({ task }: { task: StratificationTask }) {
  const [message, setMessage] = useState<string | null>(null);
  const documents = [
    { id: task.annex_23_id, label: 'Anexo 23' },
    { id: task.annex_27_status === 'completed' ? task.annex_27_id : null, label: 'Anexo 27' },
  ].filter((document): document is { id: string; label: string } => Boolean(document.id));

  const openDocument = async (id: string, download: boolean) => {
    try {
      const document = await workflowService.getAnnexDocumentUrl(id);
      if (download) {
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = document.documentName;
        link.rel = 'noopener';
        link.click();
      } else {
        window.open(document.url, '_blank', 'noopener');
      }
      setMessage(null);
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  };

  if (!documents.length) return null;
  return (
    <section className="annex-document-actions" aria-label="Documentos Word generados">
      <div>
        <strong>Documentos Word generados</strong>
        <span>Se actualizan al guardar los datos del anexo.</span>
      </div>
      <ul>
        {documents.map((document) => (
          <li key={document.id}>
            <span>{document.label}</span>
            <div>
              <button className="eval-btn eval-btn--outline" type="button" onClick={() => openDocument(document.id, false)}>Abrir Word</button>
              <button className="eval-btn eval-btn--primary" type="button" onClick={() => openDocument(document.id, true)}>Descargar</button>
            </div>
          </li>
        ))}
      </ul>
      {message && <p className="stratification-card__message" role="alert">{message}</p>}
    </section>
  );
}

function AnnexPreview({ task }: { task: StratificationTask }) {
  const annex27 = task.annex_27_data;
  return (
    <details className="annex-preview">
      <summary>Vista previa del contenido que se entrega en Word</summary>
      <div>
        <p><strong>{task.research_code}</strong> · {task.title}</p>
        <p>Investigador: {task.researcher_name}</p>
        {task.annex_23_id && <p>Anexo 23: declaración de conflicto registrada.</p>}
        {task.annex_27_status === 'completed' && (
          <p>
            Anexo 27: {annex27?.researchType || 'Investigación sin riesgo'} · resultado: <strong>Sin riesgo</strong>.
          </p>
        )}
        <p className="annex-preview__note">Usa los formularios de los anexos para editar los datos; al guardar se genera una nueva versión del Word.</p>
      </div>
    </details>
  );
}

function ConflictForm({ task, onSaved }: { task: StratificationTask; onSaved: () => Promise<void> }) {
  const [placeDate, setPlaceDate] = useState(`Manta, ${new Date().toLocaleDateString('es-EC')}`);
  const [decision, setDecision] = useState<'yes' | 'no' | ''>('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decision) {
      setMessage('Indica si existe un conflicto de interés.');
      return;
    }
    if (decision === 'yes' && !details.trim()) {
      setMessage('Describe brevemente el conflicto de interés.');
      return;
    }
    setSaving(true);
    try {
      const result = await workflowService.declareConflict(task.id, {
        placeDate: placeDate.trim(),
        hasConflict: decision === 'yes',
        details: details.trim(),
      });
      setMessage(result.message);
      await onSaved();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="annex-form" onSubmit={submit}>
      <div className="annex-form__heading">
        <span>Anexo 23</span>
        <div>
          <h3>Declaración de conflicto de interés y confidencialidad</h3>
          <p>Debes completar esta declaración antes de estratificar la investigación.</p>
        </div>
      </div>
      <label className="annex-form__field">
        <span>Lugar y fecha</span>
        <input value={placeDate} onChange={(event) => setPlaceDate(event.target.value)} required />
      </label>
      <fieldset disabled={saving}>
        <legend>¿Tienes un conflicto de interés personal o profesional con esta investigación?</legend>
        <label><input type="radio" name="conflict" value="no" checked={decision === 'no'} onChange={() => setDecision('no')} /> No tengo conflicto</label>
        <label><input type="radio" name="conflict" value="yes" checked={decision === 'yes'} onChange={() => setDecision('yes')} /> Sí tengo conflicto</label>
      </fieldset>
      {decision === 'yes' && (
        <label className="annex-form__field">
          <span>Detalle del conflicto</span>
          <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} required />
        </label>
      )}
      <p className="annex-form__declaration">
        Al registrar esta declaración confirmas tu compromiso de confidencialidad respecto de toda la información del proyecto.
      </p>
      <button className="eval-btn eval-btn--primary" type="submit" disabled={saving || !placeDate.trim()}>
        {saving ? 'Registrando...' : 'Firmar declaración'}
      </button>
      {message && <p className="stratification-card__message" role="status">{message}</p>}
    </form>
  );
}

function Annex27Form({ task, onSaved }: { task: StratificationTask; onSaved: () => Promise<void> }) {
  const saved = task.annex_27_data;
  const [researchType, setResearchType] = useState(saved?.researchType ?? 'Investigación sin riesgo');
  const [location, setLocation] = useState(saved?.location ?? '');
  const [responsibleInstitutions, setResponsibleInstitutions] = useState(saved?.responsibleInstitutions ?? '');
  const [principalInvestigatorId, setPrincipalInvestigatorId] = useState(saved?.principalInvestigatorId ?? '');
  const [principalInvestigatorDegree, setPrincipalInvestigatorDegree] = useState(saved?.principalInvestigatorDegree ?? '');
  const [criteria, setCriteria] = useState(() => createCriteria(saved?.criteria));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateCriterion = (index: number, patch: Partial<NoRiskCriterion>) => {
    setCriteria((current) => current.map((criterion, criterionIndex) => (
      criterionIndex === index ? { ...criterion, ...patch } : criterion
    )));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!criteria.some((criterion) => criterion.answer === 'yes')) {
      setMessage('Marca “Sí” en al menos un indicador que sustente la clasificación sin riesgo.');
      return;
    }
    const payload: Annex27Payload = {
      researchType: researchType.trim(),
      location: location.trim(),
      responsibleInstitutions: responsibleInstitutions.trim(),
      principalInvestigatorId: principalInvestigatorId.trim(),
      principalInvestigatorDegree: principalInvestigatorDegree.trim(),
      criteria,
    };
    setSaving(true);
    try {
      const result = await workflowService.saveNoRiskDecision(task.id, payload);
      setMessage(result.message);
      await onSaved();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="annex-form annex-form--wide" onSubmit={submit}>
      <div className="annex-form__heading">
        <span>Anexo 27</span>
        <div>
          <h3>Formato para estratificación de riesgos</h3>
          <p>En esta etapa únicamente se evalúan los criterios de investigación sin riesgo.</p>
        </div>
      </div>

      <div className="annex-form__grid">
        <label className="annex-form__field">
          <span>Tipo de investigación</span>
          <input value={researchType} onChange={(event) => setResearchType(event.target.value)} required />
        </label>
        <label className="annex-form__field">
          <span>Lugar donde se efectuará</span>
          <input value={location} onChange={(event) => setLocation(event.target.value)} required />
        </label>
        <label className="annex-form__field">
          <span>Institución o instituciones responsables</span>
          <input value={responsibleInstitutions} onChange={(event) => setResponsibleInstitutions(event.target.value)} required />
        </label>
        <label className="annex-form__field">
          <span>Cédula del investigador principal</span>
          <input value={principalInvestigatorId} onChange={(event) => setPrincipalInvestigatorId(event.target.value)} required />
        </label>
        <label className="annex-form__field annex-form__field--full">
          <span>Título de cuarto nivel (si aplica)</span>
          <input value={principalInvestigatorDegree} onChange={(event) => setPrincipalInvestigatorDegree(event.target.value)} />
        </label>
      </div>

      <div className="annex-criteria">
        <div className="annex-criteria__header">
          <strong>Indicadores de investigación sin riesgo</strong>
          <span>Sí / No y observaciones</span>
        </div>
        {criteria.map((criterion, index) => (
          <div className="annex-criterion" key={criterion.indicator}>
            <p>{index + 1}. {criterion.indicator}</p>
            <div className="annex-criterion__decision">
              <label><input type="radio" name={`criterion-${index}`} checked={criterion.answer === 'yes'} onChange={() => updateCriterion(index, { answer: 'yes' })} /> Sí</label>
              <label><input type="radio" name={`criterion-${index}`} checked={criterion.answer === 'no'} onChange={() => updateCriterion(index, { answer: 'no' })} /> No</label>
            </div>
            <input
              aria-label={`Observaciones del indicador ${index + 1}`}
              placeholder="Observaciones (opcional)"
              value={criterion.observations}
              onChange={(event) => updateCriterion(index, { observations: event.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="annex-form__conclusion">
        Resultado de esta etapa: <strong>Investigación sin riesgo</strong>
      </div>
      <button className="eval-btn eval-btn--primary" type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Completar Anexo 27 y definir riesgo'}
      </button>
      {message && <p className="stratification-card__message" role="status">{message}</p>}
    </form>
  );
}

function ResearchDocuments({ task }: { task: StratificationTask }) {
  const openDocument = async (documentId: string) => {
    try {
      const url = await storageService.getResearchDocumentUrl(documentId);
      window.open(url, '_blank', 'noopener');
    } catch (cause) {
      window.alert((cause as Error).message);
    }
  };

  return (
    <div className="stratification-documents">
      <div>
        <strong>Documentos de la investigación</strong>
        <span>{task.documents.length} archivo(s)</span>
      </div>
      <ul>
        {task.documents.map((document) => (
          <li key={document.id}>
            <span>{document.document_name}</span>
            <button className="eval-btn eval-btn--outline" type="button" onClick={() => openDocument(document.id)}>Abrir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StratificationCard({ task, onSaved }: { task: StratificationTask; onSaved: () => Promise<void> }) {
  const cancelled = task.classification_status === 'cancelled';
  const classified = task.classification_status === 'classified';

  return (
    <article className="stratification-card">
      <div className="stratification-card__header">
        <div>
          <span className="stratification-card__round">{task.research_code} · Estratificador asignado</span>
          <h2>{task.title}</h2>
          <p>{task.researcher_name} · {task.researcher_email}</p>
        </div>
        <span className={`badge ${classified ? 'badge--success' : cancelled ? 'badge--danger' : 'badge--warning'}`}>
          {classified ? 'Sin riesgo' : cancelled ? 'Cancelada' : task.has_conflict === false ? 'Anexo 27 pendiente' : 'Anexo 23 pendiente'}
        </span>
      </div>

      <div className="annex-timeline" aria-label="Estado de anexos">
        <span>Anexo 11 · Se emite al aprobar</span>
        <span className={task.annex_23_id ? 'annex-timeline__done' : ''}>Anexo 23 · {task.annex_23_id ? 'Completado' : 'Pendiente'}</span>
        <span className={task.annex_27_status === 'completed' ? 'annex-timeline__done' : ''}>Anexo 27 · {task.annex_27_status === 'completed' ? 'Completado' : 'Pendiente'}</span>
      </div>

      <ResearchDocuments task={task} />
      <Annex11Editor task={task} onSaved={onSaved} />
      <AnnexPreview task={task} />
      <AnnexDocumentActions task={task} />

      {classified ? (
        <>
          <div className="stratification-card__result">
            Anexo 27 completado. Riesgo definido: <strong>Investigación sin riesgo</strong>.
          </div>
          <details className="annex-editor">
            <summary>Editar Anexo 27 y regenerar Word</summary>
            <Annex27Form task={task} onSaved={onSaved} />
          </details>
        </>
      ) : cancelled ? (
        <div className="stratification-card__result">Esta investigación fue cancelada por administración.</div>
      ) : task.has_conflict === null ? (
        <ConflictForm task={task} onSaved={onSaved} />
      ) : task.has_conflict ? (
        <div className="workflow-alert workflow-alert--error">
          Declaraste un conflicto de interés. La investigación está esperando reasignación.
        </div>
      ) : (
        <Annex27Form task={task} onSaved={onSaved} />
      )}
    </article>
  );
}

export function StratificationDashboard() {
  const [tasks, setTasks] = useState<StratificationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const data = await workflowService.getStratificationTasks();
    setTasks(data);
  };

  useEffect(() => {
    void workflowService.getStratificationTasks()
      .then(setTasks)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  const pending = tasks.filter((task) => !['classified', 'cancelled'].includes(task.classification_status)).length;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Anexos y estratificación</h1>
          <p className="page__subtitle">{pending} investigaciones pendientes · flujo actual: sin riesgo</p>
        </div>
      </div>
      <div className="page__body">
        {error && <div className="workflow-alert workflow-alert--error" role="alert">{error}</div>}
        {loading ? (
          <div className="page__loading"><div className="pdf-spinner" /><span>Cargando...</span></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No tienes investigaciones asignadas</p>
            <p className="empty-state__desc">Las nuevas investigaciones se asignarán automáticamente.</p>
          </div>
        ) : (
          <div className="stratification-list">
            {tasks.map((task) => <StratificationCard key={task.id} task={task} onSaved={reload} />)}
          </div>
        )}
      </div>
    </div>
  );
}
