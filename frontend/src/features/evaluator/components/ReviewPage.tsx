import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReview } from '../hooks/useReview';
import { usePDFViewer } from '../../../features/evaluation/hooks/usePDFViewer';
import { PDFViewer } from '../../../features/evaluation/components/PDFViewer/PDFViewer';
import { CriteriaPanel } from '../../../features/evaluation/components/CriteriaPanel/CriteriaPanel';
import { DocxViewer } from '../../../features/evaluation/components/DocxViewer';
import { StageNav } from './StageNav';
import { platformService } from '../../../shared/services/platformService';
import { storageService } from '../../../services/storage';
import type { StudentSubmission } from '../../../shared/types/platform.types';
import { useReviewStore } from '../../../store/reviewStore';
import { btnClass, modalLayout, spinnerClass } from '../../../shared/components/common/ui';

interface FinalizeModalProps {
  onConfirm: (comment: string, grade: number) => void;
  onCancel: () => void;
}

function FinalizeModal({ onConfirm, onCancel }: FinalizeModalProps) {
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');

  return (
    <div className={modalLayout.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={modalLayout.panel}>
        <div className={modalLayout.header}>
          <h2 className={modalLayout.title}>Finalizar revisión</h2>
          <button className={modalLayout.close} onClick={onCancel} type="button" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={modalLayout.body}>
          <div className={modalLayout.field}>
            <label className={modalLayout.label}>Calificación (0 – 10)</label>
            <input
              type="number"
              className={modalLayout.input}
              placeholder="Ej: 8.5"
              min={0}
              max={10}
              step={0.5}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <div className={modalLayout.field}>
            <label className={modalLayout.label}>Comentario final para el estudiante</label>
            <textarea
              className={modalLayout.textarea}
              placeholder="Ej: El documento cumple con los criterios establecidos..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className={modalLayout.footer}>
          <button className={btnClass('outline')} onClick={onCancel} type="button">Cancelar</button>
          <button
            className={btnClass('primary')}
            disabled={!comment.trim() || grade === ''}
            onClick={() => onConfirm(comment, parseFloat(grade))}
            type="button"
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
    return () => { useReviewStore.getState().setReview(null); };
  }, [submissionId]);

  useEffect(() => {
    if (submissionId) loadFile(storageService.getRawUrl(submissionId));
  }, [submissionId, loadFile]);

  if (!review || !currentStage || !stageStats) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] gap-3 bg-slate-50 text-slate-500 text-[14px]">
        <div className={spinnerClass} />
        <span>Cargando revisión...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 h-14 bg-white border-b border-slate-200 shrink-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
            onClick={() => navigate(-1)}
            title="Volver"
            aria-label="Volver"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="w-px h-[22px] bg-slate-200 shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-snug">
              {submission?.documentName ?? 'Documento'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-500 truncate">
                {submission ? <>Revisando a: {review.studentId}</> : 'Cargando...'}
              </span>
              {isComplete && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-[0.04em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-center overflow-x-auto">
          <StageNav stages={review.stages} currentIndex={review.currentStageIndex} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isComplete && (
            <>
              <button className={btnClass('outline')} onClick={handleSave} type="button">Guardar</button>
              {isLastStage ? (
                <button className={btnClass('primary')} onClick={() => setShowFinalizeModal(true)} type="button">
                  Finalizar entrega
                </button>
              ) : (
                <button className={btnClass('primary')} onClick={handleAdvance} type="button">
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

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0">
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {submission && !submission.documentName.toLowerCase().endsWith('.pdf') ? (
            <DocxViewer url={storageService.getRawUrl(submissionId)} />
          ) : (
            <PDFViewer
              file={pdf.pdfFile}
              currentPage={pdf.currentPage}
              totalPages={pdf.totalPages}
              zoom={pdf.zoom}
              isLoading={pdf.isLoading}
              onLoadSuccess={pdf.setTotalPages}
              onLoadError={pdf.onLoadError}
              onLoadFile={pdf.loadFile}
              onPrevPage={pdf.prevPage}
              onNextPage={pdf.nextPage}
              onZoomIn={pdf.zoomIn}
              onZoomOut={pdf.zoomOut}
              onResetZoom={pdf.resetZoom}
              onPageChange={pdf.goToPage}
            />
          )}
        </main>
        <CriteriaPanel
          matrix={{
            id: currentStage.id,
            name: currentStage.name,
            version: '1.0',
            criteria: currentStage.criteria,
          }}
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
