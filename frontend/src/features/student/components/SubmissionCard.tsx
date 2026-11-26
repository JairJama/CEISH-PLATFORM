import type { ResearchType, StudentSubmission } from '../../../shared/types/platform.types';
import { badgeClass, btnClass } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

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

function documentKind(document: StudentSubmission['documents'][number]) {
  const name = document.name.toLowerCase();
  if (document.mimeType.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (document.mimeType.includes('spreadsheet') || /\.xlsx?$/.test(name)) return 'XLS';
  return 'DOC';
}

const RESEARCH_TYPE_LABEL: Record<ResearchType, string> = {
  general: 'Investigación general',
};

const STATUS_CONFIG = {
  pending: { label: 'Pendiente de revisión', variant: 'warning' },
  'under-review': { label: 'En revisión', variant: 'info' },
  reviewed: { label: 'Revisado', variant: 'success' },
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

const FILE_KIND_CLASSES = {
  PDF: 'border-red-200 bg-red-50 text-[#d92f2c]',
  XLS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DOC: 'border-slate-300 bg-slate-100 text-slate-700',
} as const;

export function SubmissionCard({ submission, onView, onEdit, onDelete, onSubmitCorrections }: Props) {
  const status = STATUS_CONFIG[submission.status];
  const isReviewed = submission.status === 'reviewed';
  const canModify = submission.classificationStatus === 'awaiting-assignment'
    || submission.classificationStatus === 'awaiting-first';

  const qualificationStyle = (() => {
    switch (submission.qualificationStatus) {
      case 'corrections-required':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'approved':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'cancelled':
      case 'expired':
        return 'bg-red-50 border-red-200 text-[#b91c1c]';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  })();

  return (
    <div className="bg-white border border-slate-200 rounded-[9px] p-[18px] flex flex-col gap-4 min-h-[265px] shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
      <div className="flex items-start gap-3.5">
        <div className="shrink-0">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#fef2f2" />
            <path d="M7 5h14a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="#ef3e3a" strokeWidth="1.3" fill="none" />
            <path d="M9 11h10M9 14.5h10M9 18h6" stroke="#ef3e3a" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="block mb-0.5 text-slate-500 text-[10px] font-extrabold tracking-[0.08em]">
            {submission.researchCode}
          </span>
          <span className="block mb-0.5 text-slate-600 text-[11px] font-semibold">
            {RESEARCH_TYPE_LABEL[submission.researchType]}
          </span>
          <p className="text-[15px] font-semibold text-slate-900 truncate">{submission.title}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">Enviado el {formatDateTime(submission.submittedAt)}</p>
        </div>
        <span className={badgeClass(status.variant)}>{status.label}</span>
      </div>

      {submission.comment && (
        <div className="p-3 bg-slate-50 border border-slate-200 border-l-[3px] border-l-[#ef3e3a] rounded-md flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">Tu comentario</span>
          <p className="text-[13px] text-slate-700 leading-relaxed">{submission.comment}</p>
        </div>
      )}

      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
        <div className="flex items-center justify-between gap-3 mb-2 text-slate-700 text-[12px]">
          <span>Documentación enviada</span>
          <strong className="text-[#ef3e3a]">{submission.documents.length}</strong>
        </div>
        <ul className="flex flex-col gap-2 list-none m-0 p-0">
          {submission.documents.map((document) => {
            const kind = documentKind(document);
            return (
              <li key={document.id} className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <span className={cn('grid w-8 h-[34px] place-items-center border rounded-[5px] text-[9px] font-extrabold shrink-0', FILE_KIND_CLASSES[kind])}>
                  {kind}
                </span>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <strong className="truncate text-slate-900 text-[12px]">{document.name}</strong>
                  <span className="text-slate-500 text-[10px]">{(document.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button className={btnClass('outline', 'min-h-[28px] px-2.5 py-1 shrink-0')} type="button" onClick={() => onView(document.id)}>
                  Abrir
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className={cn(
          'flex flex-col gap-1 px-3.5 py-3 border rounded-md',
          submission.annex11Status === 'completed'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-slate-50 text-slate-700',
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.07em] opacity-75">
          Anexo 11 · Resolución de aprobación
        </span>
        <strong className="text-[12px]">
          {submission.annex11Status === 'completed' ? 'Emitido: investigación aprobada' : 'Pendiente de aprobación'}
        </strong>
      </div>

      <div
        className={cn(
          'flex flex-col gap-1 px-3.5 py-3 rounded-md border text-[13px]',
          submission.classificationStatus === 'cancelled'
            ? 'border-red-200 bg-red-50 text-[#b91c1c]'
            : submission.riskLevel
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-slate-50 text-slate-700',
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.07em] opacity-75">Estado de estratificación</span>
        <p>{CLASSIFICATION_LABEL[submission.classificationStatus]}</p>
        {submission.riskLevel && (
          <strong>Tu investigación ha sido clasificada como: {RISK_LABEL[submission.riskLevel]}</strong>
        )}
      </div>

      {submission.qualificationStatus && (
        <div className={cn('flex flex-col items-start gap-2 p-3.5 border rounded-md text-[13px]', qualificationStyle)}>
          <span className="text-[10px] font-bold uppercase tracking-[0.07em] opacity-75">Calificación</span>
          <strong>{QUALIFICATION_LABEL[submission.qualificationStatus]}</strong>
          {submission.qualificationObservations && (
            <div className="w-full pt-2 border-t border-current/15">
              <span className="text-[11px] font-bold opacity-80">Observaciones del calificador</span>
              <p className="mt-1 leading-relaxed whitespace-pre-wrap">{submission.qualificationObservations}</p>
            </div>
          )}
          {submission.qualificationStatus === 'corrections-required' && submission.correctionDueAt && (
            <p className="text-[12px] font-semibold text-amber-900">
              Fecha máxima: {new Date(submission.correctionDueAt).toLocaleDateString('es-EC')}
            </p>
          )}
          {submission.qualificationStatus === 'corrections-required' && (
            <button className={btnClass('primary')} onClick={onSubmitCorrections} type="button">
              Subir informe de correcciones
            </button>
          )}
        </div>
      )}

      {isReviewed && (
        <div className="border-t border-slate-200 pt-3.5 flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-slate-500">Calificación</span>
            <span className="text-[28px] font-bold text-emerald-700 tabular-nums">
              {submission.grade?.toFixed(1)}{' '}
              <span className="text-[14px] text-slate-500 font-normal">/ 10</span>
            </span>
          </div>
          {submission.reviewedAt && (
            <p className="text-[12px] text-slate-500">Revisado el {formatDateTime(submission.reviewedAt)}</p>
          )}
          {submission.finalComment && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-emerald-700">
                Comentario del evaluador
              </span>
              <p className="text-[13px] text-emerald-900 leading-relaxed">{submission.finalComment}</p>
            </div>
          )}
        </div>
      )}

      {!isReviewed && canModify && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button className={btnClass('outline')} onClick={onEdit} type="button">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reemplazar documentos
          </button>
          <button className={btnClass('dangerOutline')} onClick={onDelete} type="button">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 4h9M5.5 4V2.5h3V4M6 6.5v4M8 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <rect x="3" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Retirar investigación
          </button>
        </div>
      )}
    </div>
  );
}
