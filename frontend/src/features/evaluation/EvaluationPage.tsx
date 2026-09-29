import { useEvaluation } from './hooks/useEvaluation';
import { usePDFViewer } from './hooks/usePDFViewer';
import { EvaluationHeader } from './components/EvaluationHeader';
import { PDFViewer } from './components/PDFViewer/PDFViewer';
import { CriteriaPanel } from './components/CriteriaPanel/CriteriaPanel';
import './evaluation.css';

const SESSION_ID = 'eval-001';

export function EvaluationPage() {
  const {
    session,
    activeCriterionId,
    isSaving,
    lastSaved,
    stats,
    setActiveCriterion,
    updateCriterionStatus,
    updateCriterionObservation,
    updateCriterionPageRef,
    save,
  } = useEvaluation(SESSION_ID);

  const {
    pdfFile,
    currentPage,
    totalPages,
    zoom,
    isLoading,
    setTotalPages,
    loadFile,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    resetZoom,
    goToPage,
  } = usePDFViewer();

  if (!session || !stats) {
    return (
      <div className="eval-loading">
        <div className="pdf-spinner" />
        <span>Cargando sesión de evaluación...</span>
      </div>
    );
  }

  return (
    <div className="eval-layout">
      <EvaluationHeader
        session={session}
        stats={stats}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={save}
      />
      <div className="eval-body">
        <main className="eval-pdf-panel">
          <PDFViewer
            file={pdfFile}
            currentPage={currentPage}
            totalPages={totalPages}
            zoom={zoom}
            isLoading={isLoading}
            onLoadSuccess={setTotalPages}
            onLoadFile={loadFile}
            onPrevPage={prevPage}
            onNextPage={nextPage}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            onPageChange={goToPage}
          />
        </main>
        <CriteriaPanel
          session={session}
          stats={stats}
          activeCriterionId={activeCriterionId}
          currentPdfPage={currentPage}
          onActivateCriterion={setActiveCriterion}
          onStatusChange={updateCriterionStatus}
          onObservationChange={updateCriterionObservation}
          onPageRefChange={updateCriterionPageRef}
        />
      </div>
    </div>
  );
}
