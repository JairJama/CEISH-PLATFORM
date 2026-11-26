import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { submissionsService } from '../../services/submissions';
import type { StudentSubmission } from '../../shared/types/platform.types';
import { SubmissionCard } from './components/SubmissionCard';
import { UploadModal } from './components/UploadModal';
import { CorrectionUploadModal } from './components/CorrectionUploadModal';
import { QuestionnaireModal } from './components/QuestionnaireModal';
import { workflowService } from '../../services/workflowService';
import type { QuestionnaireAnswers } from '../../shared/questionnaire';
import { btnClass, pageLayout, spinnerClass } from '../../shared/components/common/ui';
import { cn } from '../../utils/cn';

type ModalMode = 'create' | 'edit' | null;
type ResearchTab = 'create' | 'active';

export function SubmissionPage() {
  const currentUser = useAuthStore((s) => s.currentUser)!;
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingSubmission, setEditingSubmission] = useState<StudentSubmission | null>(null);
  const [correctionSubmission, setCorrectionSubmission] = useState<StudentSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<ResearchTab>('create');
  const [pendingUpload, setPendingUpload] = useState<{ files: File[]; title: string; comment: string } | null>(null);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);

  const reloadSubmissions = async () => {
    setSubmissions(await submissionsService.getAllForStudent());
  };

  useEffect(() => {
    void submissionsService.getAllForStudent().then((items) => {
      setSubmissions(items);
      setLoading(false);
    });
  }, [currentUser.id]);

  const handleConfirm = async (files: File[], title: string, comment: string) => {
    if (modalMode === 'create') {
      setPendingUpload({ files, title, comment });
      setModalMode(null);
      setQuestionnaireOpen(true);
      return;
    }
    try {
      if (modalMode === 'edit' && editingSubmission) {
        const sub = await submissionsService.updateWithDocuments(editingSubmission.id, title, files, comment);
        setSubmissions((current) => current.map((item) => item.id === sub.id ? sub : item));
      }
      setModalMode(null);
      setEditingSubmission(null);
    } catch (e) {
      window.alert(`No se pudo enviar la investigación: ${(e as Error).message}`);
    }
  };

  const handleQuestionnaireSubmit = async (questionnaire: QuestionnaireAnswers) => {
    if (!pendingUpload) return;
    const sub = await submissionsService.createWithDocuments(
      currentUser.id,
      'general',
      pendingUpload.title,
      pendingUpload.files,
      pendingUpload.comment,
      questionnaire,
    );
    setSubmissions((current) => [sub, ...current]);
    setPendingUpload(null);
    setQuestionnaireOpen(false);
    setActiveTab('active');
  };

  const handleView = async (documentId: string) => {
    try {
      const url = await submissionsService.getResearchDocumentUrl(documentId);
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      window.alert(`No se pudo abrir el documento: ${(e as Error).message}`);
    }
  };

  const handleDelete = async (submission: StudentSubmission) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar tu entrega?')) return;
    await submissionsService.remove(submission.id);
    setSubmissions((current) => current.filter((item) => item.id !== submission.id));
  };

  const handleCorrection = async (file: File) => {
    if (!correctionSubmission?.qualificationId) return;
    await workflowService.submitCorrection(correctionSubmission.qualificationId, file);
    await reloadSubmissions();
    setCorrectionSubmission(null);
  };

  return (
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Mis investigaciones</h1>
          <p className={pageLayout.subtitle}>Envía y da seguimiento independiente a cada investigación</p>
        </div>
        {!loading && activeTab === 'active' && (
          <button
            className="inline-flex items-center justify-center gap-1.5 min-h-[34px] px-3 py-2 rounded-[7px] text-[12px] font-bold text-[#d92f2c] border border-transparent hover:bg-red-50 hover:border-red-200 transition-colors"
            onClick={() => setActiveTab('create')}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Crear investigación
          </button>
        )}
      </div>

      <div className={pageLayout.body}>
        <div className="flex gap-1.5 mb-4 border-b border-slate-200 overflow-x-auto" role="tablist" aria-label="Investigaciones">
          <button
            className={cn(
              'shrink-0 border-0 border-b-2 px-2.5 sm:px-3.5 py-2.5 bg-transparent text-[13px] font-bold cursor-pointer transition-colors',
              activeTab === 'create'
                ? 'border-[#ef3e3a] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900',
            )}
            onClick={() => setActiveTab('create')}
            type="button"
            role="tab"
            aria-selected={activeTab === 'create'}
          >
            Crear investigación
          </button>
          <button
            className={cn(
              'shrink-0 border-0 border-b-2 px-2.5 sm:px-3.5 py-2.5 bg-transparent text-[13px] font-bold cursor-pointer transition-colors',
              activeTab === 'active'
                ? 'border-[#ef3e3a] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900',
            )}
            onClick={() => setActiveTab('active')}
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
          >
            Investigaciones activas{' '}
            {!loading && (
              <span className="inline-grid min-w-[18px] h-[18px] ml-1.5 px-1 place-items-center rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {submissions.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'create' ? (
          <section className="max-w-[1040px] w-full mx-auto" aria-labelledby="research-type-heading">
            <div className="mb-5 text-center">
              <h2 id="research-type-heading" className="text-slate-900 text-[21px] font-semibold">
                Sube tu investigación
              </h2>
              <p className="mt-1.5 text-slate-500 text-[13px]">
                Adjunta todos los documentos que necesites. No hay límite de archivos ni tipos predefinidos.
              </p>
            </div>
            <div className="grid grid-cols-1 max-w-[560px] mx-auto gap-4">
              <article className="flex flex-col p-5 border border-slate-200 rounded-[10px] bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
                <h3 className="text-slate-900 text-[16px] font-semibold">Investigación general</h3>
                <p className="mt-2 mb-5 text-slate-500 text-[12px] leading-relaxed">
                  Sube el protocolo y todos los documentos Word o PDF que formen parte de tu investigación.
                </p>
                <button
                  className={btnClass('primary', 'w-full mt-auto')}
                  onClick={() => { setEditingSubmission(null); setModalMode('create'); }}
                  type="button"
                >
                  Subir investigación
                </button>
              </article>
            </div>
          </section>
        ) : loading ? (
          <div className={pageLayout.loading}>
            <div className={spinnerClass} />
            <span>Cargando...</span>
          </div>
        ) : submissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-3.5">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onView={handleView}
                onEdit={() => { setEditingSubmission(submission); setModalMode('edit'); }}
                onDelete={() => void handleDelete(submission)}
                onSubmitCorrections={() => setCorrectionSubmission(submission)}
              />
            ))}
          </div>
        ) : (
          <div className={pageLayout.emptyState}>
            <div className="flex">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <rect width="52" height="52" rx="14" fill="#fef2f2" />
                <path d="M15 12h22a4 4 0 014 4v20a4 4 0 01-4 4H15a4 4 0 01-4-4V16a4 4 0 014-4z" stroke="#ef3e3a" strokeWidth="1.8" fill="none" />
                <path d="M26 21v10M21 26h10" stroke="#ef3e3a" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className={pageLayout.emptyTitle}>Aún no has enviado investigaciones</h2>
            <p className={pageLayout.emptyDesc}>
              Sube tu investigación con todos los documentos que necesites para que un miembro del CEISH la revise y estratifique.
            </p>
            <button className={btnClass('primary')} onClick={() => setActiveTab('create')} type="button">
              Crear investigación
            </button>
          </div>
        )}
      </div>

      {modalMode && (
        <UploadModal
          mode={modalMode}
          initialTitle={editingSubmission?.title}
          initialComment={editingSubmission?.comment}
          onConfirm={handleConfirm}
          onCancel={() => setModalMode(null)}
        />
      )}
      {questionnaireOpen && (
        <QuestionnaireModal
          onCancel={() => { setQuestionnaireOpen(false); setPendingUpload(null); }}
          onSubmit={handleQuestionnaireSubmit}
        />
      )}
      {correctionSubmission && (
        <CorrectionUploadModal
          onConfirm={handleCorrection}
          onCancel={() => setCorrectionSubmission(null)}
        />
      )}
    </div>
  );
}
