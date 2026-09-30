import { useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFControls } from './PDFControls';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props {
  file: File | string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  isLoading: boolean;
  onLoadSuccess: (pages: number) => void;
  onLoadFile: (file: File | string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPageChange: (page: number) => void;
}

export function PDFViewer({
  file,
  currentPage,
  totalPages,
  zoom,
  isLoading,
  onLoadSuccess,
  onLoadFile,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPageChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onLoadFile(f);
    },
    [onLoadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f?.type === 'application/pdf') onLoadFile(f);
    },
    [onLoadFile]
  );

  if (!file) {
    return (
      <div
        className="pdf-empty"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="pdf-empty__inner">
          <div className="pdf-empty__icon">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="14" fill="#eff6ff" />
              <path
                d="M17 14h18a5 5 0 015 5v14a5 5 0 01-5 5H17a5 5 0 01-5-5V19a5 5 0 015-5z"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M21 22h10M21 26h10M21 30h6"
                stroke="#3b82f6"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3 className="pdf-empty__title">Cargar documento PDF</h3>
          <p className="pdf-empty__desc">
            Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionarlo y
            comenzar la evaluación.
          </p>
          <button
            className="eval-btn eval-btn--primary"
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-viewer__canvas-area">
        {isLoading && (
          <div className="pdf-viewer__loading">
            <div className="pdf-spinner" />
            <span>Cargando documento...</span>
          </div>
        )}
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
          className="pdf-document"
          loading=""
          error={
            <div className="pdf-viewer__error">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="#ef4444" strokeWidth="2" />
                <path d="M20 13v8M20 27v1" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p>No se pudo cargar el documento.</p>
              <button
                className="eval-btn eval-btn--ghost-dark"
                onClick={() => fileInputRef.current?.click()}
              >
                Cargar otro archivo
              </button>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={zoom}
            className="pdf-page"
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      <PDFControls
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        onPrev={onPrevPage}
        onNext={onNextPage}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
        onPageChange={onPageChange}
      />
    </div>
  );
}
