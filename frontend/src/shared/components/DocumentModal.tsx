import { DocxViewer } from '../../features/evaluation/components/DocxViewer';

interface Props {
  url: string;
  name: string;
  onClose: () => void;
}

export function DocumentModal({ url, name, onClose }: Props) {
  const isPdf = name.toLowerCase().endsWith('.pdf');
  const isWord = name.toLowerCase().endsWith('.doc') || name.toLowerCase().endsWith('.docx');

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ zIndex: 1000, padding: '40px' }}>
      <div className="modal" style={{ width: '100%', height: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div className="modal__header" style={{ background: '#12161b', color: '#fff', borderBottom: '1px solid #282e36' }}>
          <h2 className="modal__title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Cerrar" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal__body" style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#e5e7eb' }}>
          {isPdf ? (
            <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title={name} />
          ) : isWord ? (
            <DocxViewer url={url} />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#1f2937' }}>
              <p>El formato del documento no puede ser previsualizado.</p>
              <a href={url} download={name} className="eval-btn eval-btn--primary" style={{ marginTop: '10px', display: 'inline-block', textDecoration: 'none' }}>Descargar archivo</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
