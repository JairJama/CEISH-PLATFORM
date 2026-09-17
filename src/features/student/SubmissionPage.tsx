import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { submissionsService } from '../../services/submissions';
import type { StudentSubmission } from '../../shared/types/platform.types';
import { SubmissionCard } from './components/SubmissionCard';
import { UploadModal } from './components/UploadModal';
import { CorrectionUploadModal } from './components/CorrectionUploadModal';
import { workflowService } from '../../services/workflowService';
import './student.css';

type ModalMode = 'create' | 'edit' | null;

export function SubmissionPage() {
  const currentUser = useAuthStore((s) => s.currentUser)!;
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  useEffect(() => {
    void submissionsService.getForStudent(currentUser.id).then((sub) => {
      setSubmission(sub);
      setLoading(false);
    });
  }, [currentUser.id]);

  const handleConfirm = async (files: File[], title: string, comment: string) => {
    try {
      if (modalMode === 'create') {
        const sub = await submissionsService.createWithDocuments(currentUser.id, title, files, comment);
        setSubmission(sub);
      } else if (modalMode === 'edit' && submission) {
        const sub = await submissionsService.updateWithDocuments(submission.id, title, files, comment);
        setSubmission(sub);
      }
      setModalMode(null);
    } catch (e) {
      window.alert(`No se pudo enviar la investigación: ${(e as Error).message}`);
    }
  };

  const handleView = async (documentId: string) => {
    try {
      const url = await submissionsService.getResearchDocumentUrl(documentId);
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      window.alert(`No se pudo abrir el documento: ${(e as Error).message}`);
    }
  };

  const handleDelete = async () => {
    if (!submission) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar tu entrega?')) return;
    await submissionsService.remove(submission.id);
    setSubmission(null);
  };

  const handleCorrection = async (file: File) => {
    if (!submission?.qualificationId) return;
    await workflowService.submitCorrection(submission.qualificationId, file);
    const updated = await submissionsService.getForStudent(currentUser.id);
    setSubmission(updated);
    setCorrectionModalOpen(false);
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Mi investigación</h1>
          <p className="page__subtitle">Envía el conjunto documental y consulta sus anexos y estratificación</p>
        </div>
        {!submission && !loading && (
          <button className="eval-btn eval-btn--primary" onClick={() => setModalMode('create')}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Nueva investigación
          </button>
        )}
      </div>

      <div className="page__body">
        {loading ? (
          <div className="page__loading">
            <div className="pdf-spinner" />
            <span>Cargando...</span>
          </div>
        ) : submission ? (
          <SubmissionCard
            submission={submission}
            onView={handleView}
            onEdit={() => setModalMode('edit')}
            onDelete={handleDelete}
            onSubmitCorrections={() => setCorrectionModalOpen(true)}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <rect width="52" height="52" rx="14" fill="#f1f5f9" />
                <path d="M15 12h22a4 4 0 014 4v20a4 4 0 01-4 4H15a4 4 0 01-4-4V16a4 4 0 014-4z" stroke="#94a3b8" strokeWidth="1.8" fill="none" />
                <path d="M26 21v10M21 26h10" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="empty-state__title">Aún no has enviado una investigación</h2>
            <p className="empty-state__desc">
              Adjunta uno o varios documentos Word para que un miembro del CEISH revise y estratifique la investigación.
            </p>
            <button className="eval-btn eval-btn--primary" onClick={() => setModalMode('create')}>
              Enviar investigación
            </button>
          </div>
        )}
      </div>

      {modalMode && (
        <UploadModal
          mode={modalMode}
          initialTitle={submission?.title}
          initialComment={submission?.comment}
          onConfirm={handleConfirm}
          onCancel={() => setModalMode(null)}
        />
      )}
      {correctionModalOpen && (
        <CorrectionUploadModal
          onConfirm={handleCorrection}
          onCancel={() => setCorrectionModalOpen(false)}
        />
      )}
    </div>
  );
}
