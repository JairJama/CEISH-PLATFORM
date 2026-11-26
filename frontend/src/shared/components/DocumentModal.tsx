import { DocxViewer } from '../../features/evaluation/components/DocxViewer';
import { btnClass, modalLayout } from './common/ui';

interface Props {
  url: string;
  name: string;
  onClose: () => void;
}

export function DocumentModal({ url, name, onClose }: Props) {
  const isPdf = name.toLowerCase().endsWith('.pdf');
  const isWord = name.toLowerCase().endsWith('.doc') || name.toLowerCase().endsWith('.docx');

  return (
    <div
      className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full h-full max-w-[1200px] flex flex-col overflow-hidden">
        <div className={modalLayout.header}>
          <h2 className="text-[16px] font-semibold text-slate-900 truncate">{name}</h2>
          <button className={modalLayout.close} onClick={onClose} aria-label="Cerrar" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-0 overflow-hidden bg-slate-200">
          {isPdf ? (
            <iframe src={url} className="w-full h-full border-0" title={name} />
          ) : isWord ? (
            <DocxViewer url={url} />
          ) : (
            <div className="p-6 text-center text-slate-800">
              <p>El formato del documento no puede ser previsualizado.</p>
              <a href={url} download={name} className={btnClass('primary', 'mt-3 no-underline')}>
                Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
