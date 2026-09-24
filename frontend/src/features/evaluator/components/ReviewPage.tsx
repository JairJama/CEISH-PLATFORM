import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReview } from '../hooks/useReview';
import { usePDFViewer } from '../../../features/evaluation/hooks/usePDFViewer';
import { PDFViewer } from '../../../features/evaluation/components/PDFViewer/PDFViewer';
import { CriteriaPanel } from '../../../features/evaluation/components/CriteriaPanel/CriteriaPanel';
import { StageNav } from './StageNav';
import { platformService } from '../../../shared/services/platformService';
import { storageService } from '../../../services/storage';
import type { StudentSubmission } from '../../../shared/types/platform.types';
import type { EvaluationSession } from '../../../features/evaluation/types/evaluation.types';
import { useAuthStore } from '../../../store/authStore';
import { useReviewStore } from '../../../store/reviewStore';
import '../../../features/evaluation/evaluation.css';
import '../evaluator.css';

interface FinalizeModalProps {
  onConfirm: (comment: string, grade: number) => void;
  onCancel: () => void;
}

function FinalizeModal({ onConfirm, onCancel }: FinalizeModalProps) {
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Finalizar revisión</h2>
          <button className="modal__close" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal__body">
          <div className="modal__field">
            <label className="modal__label">Calificación (0 – 10)</label>
            <input
              type="number"
              className="modal__input"
              placeholder="Ej: 8.5"
              min={0}
              max={10}
              step={0.5}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <div className="modal__field">
            <label className="modal__label">Comentario final para el estudiante</label>
            <textarea
              className="modal__textarea"
              placeholder="Ej: El documento cumple con los criterios establecidos..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="modal__footer">
          <button className="eval-btn eval-btn--outline" onClick={onCancel}>Cancelar</button>
          <button
            className="eval-btn eval-btn--primary"
            disabled={!comment.trim() || grade === ''}
            onClick={() => onConfirm(comment, parseFloat(grade))}
          >
            Confirmar y finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReviewPage() {
  const { submissionId = '' } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [activeCriterionId, setActiveCriterionId] = useState<string | null>(null);

  const {
    review,
    currentStage,
    stageStats,
    isLastStage,
    isComplete,
    handleAdvance,
    handleComplete,
    handleSave,
    updateStatus,
    updateObservation,
    updatePageRef,
  } = useReview(submissionId);

  const pdf = usePDFViewer();
  const { loadFile } = pdf;

  useEffect(() => {
    platformService.getAllSubmissions().then((subs) => {
      setSubmission(subs.find((s) => s.id === submissionId) ?? null);
    });
    // Clear previous review on unmount
    return () => { useReviewStore.getState().setReview(null); };
  }, [submissionId]);

  // Cargar automáticamente el documento subido por el estudiante (desde MinIO)
  useEffect(() => {
    if (submissionId) loadFile(storageService.getRawUrl(submissionId));
  }, [submissionId, loadFile]);

  if (!review || !currentStage || !stageStats) {
    return (
      <div className="eval-loading">
        <div className="pdf-spinner" />
        <span>Cargando revisión...</span>
      </div>
    );
  }

  // Build a fake EvaluationSession to reuse CriteriaPanel unchanged
  const stageAsSession: EvaluationSession = {
    id: review.id,
    documentName: submission?.documentName ?? 'Documento',
    evaluator: currentUser?.name ?? '',
    matrix: {
      id: currentStage.id,
      name: currentStage.name,
      version: '1.0',
      criteria: currentStage.criteria,
    },
    status: 'in-progress',
    createdAt: review.id,
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="eval-layout">
      {/* ── Review header ── */}
      <header className="eval-header review-header">
        <div className="eval-header__left">
          <button className="review-header__back" onClick={() => navigate(-1)} title="Volver">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="eval-header__divider" />
          <div className="eval-header__doc-info">
            <p className="eval-header__doc-name">{submission?.documentName ?? 'Documento'}</p>
            <div className="eval-header__meta">
              <span className="eval-header__evaluator">
                {submission ? (
                  <>Revisando a: {review.studentId}</>
                ) : 'Cargando...'}
              </span>
              {isComplete && (
                <span className="eval-header__status eval-header__status--completed">Completado</span>
              )}
            </div>
          </div>
        </div>

        <div className="review-header__stages">
          <StageNav stages={review.stages} currentIndex={review.currentStageIndex} />
        </div>

        <div className="eval-header__right">
          {!isComplete && (
            <>
              <button className="eval-btn eval-btn--ghost" onClick={handleSave}>Guardar</button>
              {isLastStage ? (
                <button className="eval-btn eval-btn--primary" onClick={() => setShowFinalizeModal(true)}>
                  Finalizar entrega
                </button>
              ) : (
                <button className="eval-btn eval-btn--primary" onClick={handleAdvance}>
                  Siguiente etapa
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Two-panel body (reuses existing components) ── */}
      <div className="eval-body">
        <main className="eval-pdf-panel">
          <PDFViewer
            file={pdf.pdfFile}
            currentPage={pdf.currentPage}
            totalPages={pdf.totalPages}
            zoom={pdf.zoom}
            isLoading={pdf.isLoading}
            onLoadSuccess={pdf.setTotalPages}
            onLoadFile={pdf.loadFile}
            onPrevPage={pdf.prevPage}
            onNextPage={pdf.nextPage}
            onZoomIn={pdf.zoomIn}
            onZoomOut={pdf.zoomOut}
            onResetZoom={pdf.resetZoom}
            onPageChange={pdf.goToPage}
          />
        </main>
        <CriteriaPanel
          session={stageAsSession}
          stats={stageStats}
          activeCriterionId={activeCriterionId}
          currentPdfPage={pdf.currentPage}
          onActivateCriterion={setActiveCriterionId}
          onStatusChange={isComplete ? () => {} : updateStatus}
          onObservationChange={isComplete ? () => {} : updateObservation}
          onPageRefChange={isComplete ? () => {} : updatePageRef}
        />
      </div>

      {showFinalizeModal && (
        <FinalizeModal
          onConfirm={async (comment, grade) => {
            await handleComplete(comment, grade);
            setShowFinalizeModal(false);
          }}
          onCancel={() => setShowFinalizeModal(false)}
        />
      )}
    </div>
  );
}
