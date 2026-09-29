interface Props {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPageChange: (page: number) => void;
}

export function PDFControls({
  currentPage,
  totalPages,
  zoom,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPageChange,
}: Props) {
  return (
    <div className="pdf-controls">
      <div className="pdf-controls__group">
        <button
          className="pdf-controls__btn"
          onClick={onPrev}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="pdf-controls__page">
          <input
            type="number"
            className="pdf-controls__page-input"
            value={currentPage}
            min={1}
            max={totalPages || 1}
            onChange={(e) => onPageChange(Number(e.target.value))}
          />
          <span className="pdf-controls__page-sep">/</span>
          <span className="pdf-controls__page-total">{totalPages || '—'}</span>
        </div>
        <button
          className="pdf-controls__btn"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="pdf-controls__divider" />

      <div className="pdf-controls__group">
        <button className="pdf-controls__btn" onClick={onZoomOut} aria-label="Reducir zoom">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10.5 10.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="pdf-controls__zoom-label"
          onClick={onResetZoom}
          title="Restablecer zoom al 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button className="pdf-controls__btn" onClick={onZoomIn} aria-label="Aumentar zoom">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10.5 10.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
