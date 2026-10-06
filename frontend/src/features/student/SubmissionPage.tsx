import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { submissionsService } from '../../services/submissions';
import type { ResearchType, StudentSubmission } from '../../shared/types/platform.types';
import { SubmissionCard } from './components/SubmissionCard';
import { UploadModal } from './components/UploadModal';
import { CorrectionUploadModal } from './components/CorrectionUploadModal';
import { workflowService } from '../../services/workflowService';
import { RESEARCH_TYPES, type ResearchTypeOption } from './researchTypes';
import './student.css';

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
  const [selectedResearchType, setSelectedResearchType] = useState<ResearchType | null>(null);
  const [createdType, setCreatedType] = useState<ResearchTypeOption | null>(null);

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
    try {
      if (modalMode === 'create' && selectedResearchType) {
        const sub = await submissionsService.createWithDocuments(currentUser.id, selectedResearchType, title, files, comment);
        setSubmissions((current) => [sub, ...current]);
        setCreatedType(RESEARCH_TYPES.find((type) => type.id === selectedResearchType) ?? null);
        setActiveTab('active');
      } else if (modalMode === 'edit' && editingSubmission) {
        const sub = await submissionsService.updateWithDocuments(editingSubmission.id, title, files, comment);
        setSubmissions((current) => current.map((item) => item.id === sub.id ? sub : item));
      }
      setModalMode(null);
      setEditingSubmission(null);
      setSelectedResearchType(null);
    } catch (e) {
      window.alert(`No se pudo enviar la investigación: ${(e as Error).message}`);
    }
  };

  const startCreation = (researchType: ResearchType) => {
    setCreatedType(null);
    setEditingSubmission(null);
    setSelectedResearchType(researchType);
    setModalMode('create');
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
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Mis investigaciones</h1>
          <p className="page__subtitle">Envía y da seguimiento independiente a cada investigación</p>
        </div>
        {!loading && activeTab === 'active' && (
          <button className="eval-btn eval-btn--primary student-new-research" onClick={() => setActiveTab('create')}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Crear investigación
          </button>
        )}
      </div>

      <div className="page__body">
        <div className="student-tabs" role="tablist" aria-label="Investigaciones">
          <button className={activeTab === 'create' ? 'student-tabs__tab student-tabs__tab--active' : 'student-tabs__tab'} onClick={() => setActiveTab('create')} type="button" role="tab" aria-selected={activeTab === 'create'}>Crear investigación</button>
          <button className={activeTab === 'active' ? 'student-tabs__tab student-tabs__tab--active' : 'student-tabs__tab'} onClick={() => setActiveTab('active')} type="button" role="tab" aria-selected={activeTab === 'active'}>Investigaciones activas {!loading && <span>{submissions.length}</span>}</button>
        </div>

        {activeTab === 'create' ? (
          <section className="research-type-picker" aria-labelledby="research-type-heading">
            <div className="research-type-picker__intro">
              <h2 id="research-type-heading">Elige el tipo de investigación</h2>
              <p>Cada tipo requiere cuatro anexos. Selecciona una opción para cargar tu documentación.</p>
            </div>
            <div className="research-type-picker__cards">
              {RESEARCH_TYPES.map((researchType) => (
                <article className="research-type-card" key={researchType.id}>
                  <h3>{researchType.name}</h3>
                  <p>{researchType.description}</p>
                  <ul>
                    {researchType.annexes.map((annex) => <li key={annex.number}><strong>Anexo {annex.number}</strong><span>{annex.name}</span></li>)}
                  </ul>
                  <button className="eval-btn eval-btn--primary" onClick={() => startCreation(researchType.id)} type="button">Seleccionar y subir anexos</button>
                </article>
              ))}
            </div>
          </section>
        ) : loading ? (
          <div className="page__loading">
            <div className="pdf-spinner" />
            <span>Cargando...</span>
          </div>
        ) : submissions.length > 0 ? (
          <>
            {createdType && <div className="research-created-notice" role="status">Se ha creado una investigación de tipo <strong>{createdType.name}</strong>.</div>}
          <div className="student-submissions-list">
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
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <rect width="52" height="52" rx="14" fill="#f1f5f9" />
                <path d="M15 12h22a4 4 0 014 4v20a4 4 0 01-4 4H15a4 4 0 01-4-4V16a4 4 0 014-4z" stroke="#94a3b8" strokeWidth="1.8" fill="none" />
                <path d="M26 21v10M21 26h10" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="empty-state__title">Aún no has enviado investigaciones</h2>
            <p className="empty-state__desc">
              Crea una investigación y adjunta sus cuatro anexos para que un miembro del CEISH la revise y estratifique.
            </p>
            <button className="eval-btn eval-btn--primary" onClick={() => setActiveTab('create')}>
              Crear investigación
            </button>
          </div>
        )}
      </div>

      {modalMode && (
        <UploadModal
          mode={modalMode}
          researchType={modalMode === 'create' ? selectedResearchType ?? undefined : undefined}
          initialTitle={editingSubmission?.title}
          initialComment={editingSubmission?.comment}
          onConfirm={handleConfirm}
          onCancel={() => { setModalMode(null); setSelectedResearchType(null); }}
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
