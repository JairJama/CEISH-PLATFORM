import { useEffect, useRef, useState } from 'react';
import * as docx from 'docx-preview';
import { apiFetch } from '../../../services/http';

interface Props {
  url: string;
}

export function DocxViewer({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState(() => ({ url, loading: true, error: false }));
  const { loading, error } = loadState.url === url ? loadState : { loading: true, error: false };

  useEffect(() => {
    let active = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const loadDoc = async () => {
      try {
        const res = await apiFetch(url);
        if (!res.ok) throw new Error('Network response was not ok');
        const blob = await res.blob();
        
        if (active && containerRef.current) {
          await docx.renderAsync(blob, containerRef.current, undefined, {
            className: 'docx-viewer-content',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: true,
          });
          if (active) setLoadState({ url, loading: false, error: false });
        }
      } catch (err) {
        console.error('Error rendering docx:', err);
        if (active) {
          setLoadState({ url, loading: false, error: true });
        }
      }
    };

    loadDoc();

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div className="docx-viewer-container" style={{ width: '100%', height: '100%', overflow: 'auto', background: '#e5e7eb', position: 'relative' }}>
      {loading && (
        <div className="pdf-viewer__loading" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.9)', zIndex: 10 }}>
          <div className="pdf-spinner" />
          <span style={{ color: 'white', marginTop: '10px' }}>Cargando documento de Word...</span>
        </div>
      )}
      {error && (
        <div className="pdf-viewer__error" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.9)', zIndex: 10 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#ef4444" strokeWidth="2" />
            <path d="M20 13v8M20 27v1" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ color: 'white', marginTop: '10px' }}>No se pudo cargar el documento de Word.</p>
        </div>
      )}
      <div ref={containerRef} style={{ padding: '20px', minHeight: '100%' }} />
    </div>
  );
}
