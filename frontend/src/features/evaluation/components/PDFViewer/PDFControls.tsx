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

const ctrlBtnClass =
  'flex items-center justify-center w-[30px] h-[30px] rounded-md border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-38 disabled:cursor-not-allowed';

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
    <div className="flex items-center justify-center gap-1 px-5 py-2.5 bg-white border-t border-slate-200 shrink-0">
      <div className="flex items-center gap-1">
        <button
          className={ctrlBtnClass}
          onClick={onPrev}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 px-1">
          <input
            type="number"
            className="w-[42px] h-7 border border-slate-300 rounded-md text-center text-[12px] text-slate-900 bg-white outline-none transition focus:border-[#ef3e3a] focus:ring-2 focus:ring-[#ef3e3a]/15 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={currentPage}
            min={1}
            max={totalPages || 1}
            onChange={(e) => onPageChange(Number(e.target.value))}
          />
          <span className="text-[12px] text-slate-400">/</span>
          <span className="text-[12px] text-slate-500">{totalPages || '—'}</span>
        </div>
        <button
          className={ctrlBtnClass}
          onClick={onNext}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="w-px h-[18px] bg-slate-200 mx-2.5" />

      <div className="flex items-center gap-1">
        <button className={ctrlBtnClass} onClick={onZoomOut} aria-label="Reducir zoom" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10.5 10.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="text-[12px] font-medium text-slate-700 min-w-[42px] text-center bg-transparent border border-transparent px-1.5 py-1 rounded cursor-pointer transition-colors hover:bg-slate-100"
          onClick={onResetZoom}
          title="Restablecer zoom al 100%"
          type="button"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button className={ctrlBtnClass} onClick={onZoomIn} aria-label="Aumentar zoom" type="button">
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
