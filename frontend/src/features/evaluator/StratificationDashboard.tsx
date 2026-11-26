import { useEffect, useState, type FormEvent } from 'react';
import {
  workflowService,
  type Annex27Payload,
  type NoRiskCriterion,
  type StratificationTask,
} from '../../services/workflowService';
import { storageService } from '../../services/storage';
import { DocumentModal } from '../../shared/components/DocumentModal';
import { badgeClass, btnClass, pageLayout, spinnerClass } from '../../shared/components/common/ui';
import { cn } from '../../utils/cn';

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

const formFieldLabelClass =
  'flex flex-col gap-1.5 w-full text-slate-600 text-[10px] font-bold tracking-[0.05em] uppercase';
const formFieldInputClass =
  'w-full px-2.5 py-2 border border-slate-300 rounded-md text-slate-900 bg-white text-[12px] font-normal tracking-normal normal-case outline-none focus:border-[#ef3e3a] focus:ring-2 focus:ring-[#ef3e3a]/15';

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
    <details className="group/editor w-full border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
      <summary className="px-3.5 py-2.5 text-[#d92f2c] text-[11px] font-bold cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none group-open/editor:border-b group-open/editor:border-slate-200">
        Preparar datos del Anexo 11{' '}
        <span className="text-slate-400 group-open/editor:hidden">›</span>
        <span className="text-slate-400 hidden group-open/editor:inline">‹</span>
      </summary>
      <form className="flex flex-col items-start gap-3 p-4 bg-slate-50" onSubmit={save}>
        <div className="flex items-start gap-3">
          <span className="shrink-0 px-2 py-1 rounded text-white bg-[#ef3e3a] text-[10px] font-extrabold uppercase">
            Anexo 11
          </span>
          <div>
            <h3 className="text-slate-900 text-[14px] font-semibold">Resolución de aprobación</h3>
            <p className="mt-0.5 text-slate-500 text-[11px]">
              Estos datos se conservarán como borrador y el Anexo 11 se emitirá al aprobar la investigación.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          <label className={formFieldLabelClass}>
            <span>Número de oficio</span>
            <input className={formFieldInputClass} value={officeNumber} onChange={(event) => setOfficeNumber(event.target.value)} />
          </label>
          <label className={formFieldLabelClass}>
            <span>Fecha de emisión</span>
            <input className={formFieldInputClass} type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
          </label>
          <label className={formFieldLabelClass}>
            <span>Tipo de estudio</span>
            <input className={formFieldInputClass} value={studyType} onChange={(event) => setStudyType(event.target.value)} />
          </label>
          <label className={formFieldLabelClass}>
            <span>Duración en meses</span>
            <input className={formFieldInputClass} type="number" min="0" value={durationMonths} onChange={(event) => setDurationMonths(event.target.value)} />
          </label>
          <label className={formFieldLabelClass}>
            <span>Instituciones participantes</span>
            <input className={formFieldInputClass} value={participatingInstitutions} onChange={(event) => setParticipatingInstitutions(event.target.value)} />
          </label>
          <label className={formFieldLabelClass}>
            <span>Investigadores del estudio</span>
            <input className={formFieldInputClass} value={studyResearchers} onChange={(event) => setStudyResearchers(event.target.value)} />
          </label>
        </div>
        <button className={btnClass('outline')} type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Anexo 11'}
        </button>
        {message && <p className="text-[12px] text-slate-600" role="status">{message}</p>}
      </form>
    </details>
  );
}

function AnnexDocumentActions({ task }: { task: StratificationTask }) {
  const [message, setMessage] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);
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
        setViewingDoc({ url: document.url, name: document.documentName });
      }
      setMessage(null);
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  };

  if (!documents.length) return null;
  return (
    <section
      className="flex flex-col gap-2.5 w-full px-3.5 py-3 border border-red-200 rounded-md bg-red-50/50"
      aria-label="Documentos Word generados"
    >
      <div className="flex flex-col gap-0.5">
        <strong className="text-slate-900 text-[12px]">Documentos Word generados</strong>
        <span className="text-slate-500 text-[11px]">Se actualizan al guardar los datos del anexo.</span>
      </div>
      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex items-center justify-between gap-3 pt-2 border-t border-red-200/80 text-slate-800 text-[12px]"
          >
            <span className="font-medium">{document.label}</span>
            <div className="flex flex-wrap gap-1.5">
              <button className={btnClass('outline', 'min-h-[28px] px-2.5 py-1')} type="button" onClick={() => openDocument(document.id, false)}>
                Abrir Word
              </button>
              <button className={btnClass('primary', 'min-h-[28px] px-2.5 py-1')} type="button" onClick={() => openDocument(document.id, true)}>
                Descargar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {message && <p className="text-[12px] text-[#b91c1c]" role="alert">{message}</p>}
      {viewingDoc && <DocumentModal url={viewingDoc.url} name={viewingDoc.name} onClose={() => setViewingDoc(null)} />}
    </section>
  );
}

function AnnexPreview({ task }: { task: StratificationTask }) {
  const annex27 = task.annex_27_data;
  return (
    <details className="group/preview w-full border border-slate-200 rounded-lg bg-slate-50">
      <summary className="px-3.5 py-2.5 text-slate-700 text-[11px] font-bold cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        Vista previa del contenido que se entrega en Word{' '}
        <span className="text-slate-400 group-open/preview:hidden">›</span>
        <span className="text-slate-400 hidden group-open/preview:inline">‹</span>
      </summary>
      <div className="flex flex-col gap-1.5 px-3.5 pb-3 text-slate-700 text-[12px] leading-relaxed">
        <p><strong>{task.research_code}</strong> · {task.title}</p>
        <p>Investigador: {task.researcher_name}</p>
        {task.annex_23_id && <p>Anexo 23: declaración de conflicto registrada.</p>}
        {task.annex_27_status === 'completed' && (
          <p>
            Anexo 27: {annex27?.researchType || 'Investigación sin riesgo'} · resultado: <strong>Sin riesgo</strong>.
          </p>
        )}
        <p className="text-slate-500 text-[11px]">
          Usa los formularios de los anexos para editar los datos; al guardar se genera una nueva versión del Word.
        </p>
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
    <form className="flex flex-col items-start gap-3.5 p-4 border border-red-200 rounded-[9px] bg-red-50/40" onSubmit={submit}>
      <div className="flex items-start gap-3">
        <span className="shrink-0 px-2 py-1 rounded text-white bg-[#ef3e3a] text-[10px] font-extrabold uppercase">
          Anexo 23
        </span>
        <div>
          <h3 className="text-slate-900 text-[14px] font-semibold">
            Declaración de conflicto de interés y confidencialidad
          </h3>
          <p className="mt-0.5 text-slate-500 text-[11px]">
            Debes completar esta declaración antes de estratificar la investigación.
          </p>
        </div>
      </div>
      <label className={cn(formFieldLabelClass, 'max-w-[680px]')}>
        <span>Lugar y fecha</span>
        <input className={formFieldInputClass} value={placeDate} onChange={(event) => setPlaceDate(event.target.value)} required />
      </label>
      <fieldset className="flex flex-wrap gap-2 w-full p-0 border-0" disabled={saving}>
        <legend className="w-full mb-1.5 text-slate-800 text-[12px] font-bold">
          ¿Tienes un conflicto de interés personal o profesional con esta investigación?
        </legend>
        <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-md text-slate-800 bg-white text-[12px] cursor-pointer">
          <input type="radio" name="conflict" value="no" checked={decision === 'no'} onChange={() => setDecision('no')} className="accent-[#ef3e3a]" />
          No tengo conflicto
        </label>
        <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-md text-slate-800 bg-white text-[12px] cursor-pointer">
          <input type="radio" name="conflict" value="yes" checked={decision === 'yes'} onChange={() => setDecision('yes')} className="accent-[#ef3e3a]" />
          Sí tengo conflicto
        </label>
      </fieldset>
      {decision === 'yes' && (
        <label className={cn(formFieldLabelClass, 'max-w-[680px]')}>
          <span>Detalle del conflicto</span>
          <textarea
            className={cn(formFieldInputClass, 'resize-y')}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            required
          />
        </label>
      )}
      <p className="max-w-[760px] text-slate-500 text-[11px] leading-relaxed">
        Al registrar esta declaración confirmas tu compromiso de confidencialidad respecto de toda la información del proyecto.
      </p>
      <button className={btnClass('primary')} type="submit" disabled={saving || !placeDate.trim()}>
        {saving ? 'Registrando...' : 'Firmar declaración'}
      </button>
      {message && <p className="text-[12px] text-slate-600" role="status">{message}</p>}
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
    <form className="flex flex-col items-start gap-3.5 p-4 border border-red-200 rounded-[9px] bg-red-50/35 w-full" onSubmit={submit}>
      <div className="flex items-start gap-3">
        <span className="shrink-0 px-2 py-1 rounded text-white bg-[#ef3e3a] text-[10px] font-extrabold uppercase">
          Anexo 27
        </span>
        <div>
          <h3 className="text-slate-900 text-[14px] font-semibold">Formato para estratificación de riesgos</h3>
          <p className="mt-0.5 text-slate-500 text-[11px]">
            En esta etapa únicamente se evalúan los criterios de investigación sin riesgo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        <label className={formFieldLabelClass}>
          <span>Tipo de investigación</span>
          <input className={formFieldInputClass} value={researchType} onChange={(event) => setResearchType(event.target.value)} required />
        </label>
        <label className={formFieldLabelClass}>
          <span>Lugar donde se efectuará</span>
          <input className={formFieldInputClass} value={location} onChange={(event) => setLocation(event.target.value)} required />
        </label>
        <label className={formFieldLabelClass}>
          <span>Institución o instituciones responsables</span>
          <input className={formFieldInputClass} value={responsibleInstitutions} onChange={(event) => setResponsibleInstitutions(event.target.value)} required />
        </label>
        <label className={formFieldLabelClass}>
          <span>Cédula del investigador principal</span>
          <input className={formFieldInputClass} value={principalInvestigatorId} onChange={(event) => setPrincipalInvestigatorId(event.target.value)} required />
        </label>
        <label className={cn(formFieldLabelClass, 'md:col-span-2')}>
          <span>Título de cuarto nivel (si aplica)</span>
          <input className={formFieldInputClass} value={principalInvestigatorDegree} onChange={(event) => setPrincipalInvestigatorDegree(event.target.value)} />
        </label>
      </div>

      <div className="w-full overflow-hidden border border-slate-200 rounded-md bg-white">
        <div className="flex justify-between gap-3 px-3 py-2.5 text-slate-800 bg-slate-50 text-[11px]">
          <strong>Indicadores de investigación sin riesgo</strong>
          <span className="text-slate-500">Sí / No y observaciones</span>
        </div>
        {criteria.map((criterion, index) => (
          <div
            className="grid grid-cols-1 md:grid-cols-[minmax(240px,1.6fr)_auto_minmax(180px,1fr)] items-center gap-3 px-3 py-2.5 border-t border-slate-200"
            key={criterion.indicator}
          >
            <p className="text-slate-700 text-[11px] leading-snug">{index + 1}. {criterion.indicator}</p>
            <div className="flex gap-3">
              <label className="flex items-center gap-1 text-slate-700 text-[11px] cursor-pointer">
                <input
                  type="radio"
                  name={`criterion-${index}`}
                  checked={criterion.answer === 'yes'}
                  onChange={() => updateCriterion(index, { answer: 'yes' })}
                  className="accent-[#ef3e3a]"
                />
                Sí
              </label>
              <label className="flex items-center gap-1 text-slate-700 text-[11px] cursor-pointer">
                <input
                  type="radio"
                  name={`criterion-${index}`}
                  checked={criterion.answer === 'no'}
                  onChange={() => updateCriterion(index, { answer: 'no' })}
                  className="accent-[#ef3e3a]"
                />
                No
              </label>
            </div>
            <input
              className={formFieldInputClass}
              aria-label={`Observaciones del indicador ${index + 1}`}
              placeholder="Observaciones (opcional)"
              value={criterion.observations}
              onChange={(event) => updateCriterion(index, { observations: event.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="w-full px-3.5 py-2.5 border border-emerald-200 rounded-md text-emerald-800 bg-emerald-50 text-[12px]">
        Resultado de esta etapa: <strong>Investigación sin riesgo</strong>
      </div>
      <button className={btnClass('primary')} type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Completar Anexo 27 y definir riesgo'}
      </button>
      {message && <p className="text-[12px] text-slate-600" role="status">{message}</p>}
    </form>
  );
}

function ResearchDocuments({ task }: { task: StratificationTask }) {
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);

  const openDocument = async (documentId: string, name: string) => {
    try {
      const url = await storageService.getResearchDocumentUrl(documentId);
      setViewingDoc({ url, name });
    } catch (cause) {
      window.alert((cause as Error).message);
    }
  };

  return (
    <div className="px-3.5 py-3 border border-slate-200 rounded-md bg-slate-50">
      <div className="flex justify-between gap-3 text-slate-800 text-[12px]">
        <strong>Documentos de la investigación</strong>
        <span className="text-slate-500">{task.documents.length} archivo(s)</span>
      </div>
      <ul className="flex flex-col gap-2 mt-2.5 list-none m-0 p-0">
        {task.documents.map((document) => (
          <li key={document.id} className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <span className="truncate text-slate-700 text-[12px]">{document.document_name}</span>
            <div className="flex gap-1.5 shrink-0">
              <button
                className={btnClass('outline', 'min-h-[28px] px-2.5 py-1')}
                type="button"
                onClick={() => openDocument(document.id, document.document_name)}
              >
                Abrir
              </button>
              <button
                className={btnClass('ghost', 'min-h-[28px] px-2.5 py-1')}
                type="button"
                onClick={async () => {
                  try {
                    const url = await storageService.getResearchDocumentUrl(document.id);
                    const link = window.document.createElement('a');
                    link.href = url;
                    link.download = document.document_name;
                    link.rel = 'noopener';
                    link.click();
                  } catch (cause) {
                    window.alert((cause as Error).message);
                  }
                }}
              >
                Descargar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {viewingDoc && <DocumentModal url={viewingDoc.url} name={viewingDoc.name} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}

function StratificationCard({ task, onSaved }: { task: StratificationTask; onSaved: () => Promise<void> }) {
  const cancelled = task.classification_status === 'cancelled';
  const classified = task.classification_status === 'classified';

  return (
    <details className="group open:col-span-full relative flex flex-col gap-3.5 p-[18px] bg-white border border-slate-200 rounded-[9px] shadow-xs">
      <summary className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 pb-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div>
          <span className="text-[10px] font-bold text-[#ef3e3a] uppercase tracking-[0.08em]">
            {task.research_code} · Estratificador asignado
          </span>
          <h2 className="mt-1 text-[16px] font-semibold text-slate-900">{task.title}</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">{task.researcher_name} · {task.researcher_email}</p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-start">
          <span className={badgeClass(classified ? 'success' : cancelled ? 'danger' : 'warning')}>
            {classified ? 'Sin riesgo' : cancelled ? 'Cancelada' : task.has_conflict === false ? 'Anexo 27 pendiente' : 'Anexo 23 pendiente'}
          </span>
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            <span className="group-open:hidden">Abrir carpeta ›</span>
            <span className="hidden group-open:inline">Cerrar carpeta ‹</span>
          </span>
        </div>
      </summary>

      <div className="flex flex-col gap-3.5 pt-3.5 border-t border-slate-200">
        <div className="flex flex-wrap gap-2" aria-label="Estado de anexos">
          <span className="px-2.5 py-1 border border-slate-200 rounded-full text-slate-600 bg-slate-100 text-[10px] font-bold">
            Anexo 11 · Se emite al aprobar
          </span>
          <span
            className={cn(
              'px-2.5 py-1 border rounded-full text-[10px] font-bold',
              task.annex_23_id
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                : 'border-slate-200 text-slate-600 bg-slate-100',
            )}
          >
            Anexo 23 · {task.annex_23_id ? 'Completado' : 'Pendiente'}
          </span>
          <span
            className={cn(
              'px-2.5 py-1 border rounded-full text-[10px] font-bold',
              task.annex_27_status === 'completed'
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                : 'border-slate-200 text-slate-600 bg-slate-100',
            )}
          >
            Anexo 27 · {task.annex_27_status === 'completed' ? 'Completado' : 'Pendiente'}
          </span>
        </div>

        <ResearchDocuments task={task} />
        <Annex11Editor task={task} onSaved={onSaved} />
        <AnnexPreview task={task} />
        <AnnexDocumentActions task={task} />

        {classified ? (
          <>
            <div className="px-3 py-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-800">
              Anexo 27 completado. Riesgo definido: <strong>Investigación sin riesgo</strong>.
            </div>
            <details className="group/edit27 w-full border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
              <summary className="px-3.5 py-2.5 text-[#d92f2c] text-[11px] font-bold cursor-pointer list-none [&::-webkit-details-marker]:hidden group-open/edit27:border-b group-open/edit27:border-slate-200">
                Editar Anexo 27 y regenerar Word{' '}
                <span className="text-slate-400 group-open/edit27:hidden">›</span>
                <span className="text-slate-400 hidden group-open/edit27:inline">‹</span>
              </summary>
              <div className="p-2">
                <Annex27Form task={task} onSaved={onSaved} />
              </div>
            </details>
          </>
        ) : cancelled ? (
          <div className="px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-[13px] text-[#b91c1c]">
            Esta investigación fue cancelada por administración.
          </div>
        ) : task.has_conflict === null ? (
          <ConflictForm task={task} onSaved={onSaved} />
        ) : task.has_conflict ? (
          <div className={pageLayout.alertError}>
            Declaraste un conflicto de interés. La investigación está esperando reasignación.
          </div>
        ) : (
          <Annex27Form task={task} onSaved={onSaved} />
        )}
      </div>
    </details>
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
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Anexos y estratificación</h1>
          <p className={pageLayout.subtitle}>{pending} investigaciones pendientes · flujo actual: sin riesgo</p>
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
            <p className={pageLayout.emptyTitle}>No tienes investigaciones asignadas</p>
            <p className={pageLayout.emptyDesc}>Las nuevas investigaciones se asignarán automáticamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[repeat(auto-fit,minmax(430px,1fr))] items-start gap-3.5">
            {tasks.map((task) => <StratificationCard key={task.id} task={task} onSaved={reload} />)}
          </div>
        )}
      </div>
    </div>
  );
}
