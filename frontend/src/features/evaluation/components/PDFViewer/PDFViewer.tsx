import { useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFControls } from './PDFControls';
import { btnClass, spinnerClass } from '../../../../shared/components/common/ui';

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
  onLoadError?: () => void;
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
  onLoadError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onLoadFile(f);
    },
    [onLoadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f?.type === 'application/pdf') onLoadFile(f);
    },
    [onLoadFile],
  );

  if (!file) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-8 bg-slate-200/75"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-[380px] bg-white px-9 py-11 rounded-xl shadow-sm border-2 border-dashed border-slate-300 transition-colors hover:border-[#ef3e3a]">
          <div className="flex">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="14" fill="#fef2f2" />
              <path d="M17 14h18a5 5 0 015 5v14a5 5 0 01-5 5H17a5 5 0 01-5-5V19a5 5 0 015-5z" stroke="#ef3e3a" strokeWidth="2" fill="none" />
              <path d="M21 22h10M21 26h10M21 30h6" stroke="#ef3e3a" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-[17px] font-semibold text-slate-900">Cargar documento PDF</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-[280px]">
            Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionarlo y
            comenzar la evaluación.
          </p>
          <button
            className={btnClass('primary')}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Seleccionar PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            hidden
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-100">
      <div className="relative flex-1 overflow-auto flex flex-col items-center py-7 px-6 bg-slate-200/80 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-100/85 backdrop-blur-[2px] text-slate-600 text-[13px]">
            <div className={spinnerClass} />
            <span>Cargando documento...</span>
          </div>
        )}
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
          onLoadError={onLoadError}
          className="flex flex-col items-center gap-3"
          loading=""
          error={
            <div className="flex flex-col items-center gap-3 px-8 py-12 text-slate-600 text-[13px] bg-white rounded-xl border border-red-200">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="#ef3e3a" strokeWidth="2" />
                <path d="M20 13v8M20 27v1" stroke="#ef3e3a" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p>No se pudo cargar el documento.</p>
              <button
                className={btnClass('outline')}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Cargar otro archivo
              </button>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={zoom}
            className="[&_canvas]:block [&_canvas]:rounded-[2px] [&_canvas]:shadow-[0_2px_16px_rgba(15,23,42,0.14),0_0_0_1px_rgba(15,23,42,0.08)]"
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          hidden
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
