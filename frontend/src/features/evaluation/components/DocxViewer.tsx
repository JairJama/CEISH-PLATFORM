import { useEffect, useRef, useState } from 'react';
import * as docx from 'docx-preview';
import { apiFetch } from '../../../services/http';
import { spinnerClass } from '../../../shared/components/common/ui';

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
    <div className="relative w-full h-full overflow-auto bg-slate-200">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-white/90 backdrop-blur-[2px]">
          <div className={spinnerClass} />
          <span className="text-[13px] font-medium text-slate-600">Cargando documento de Word...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-white/95">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#ef3e3a" strokeWidth="2" />
            <path d="M20 13v8M20 27v1" stroke="#ef3e3a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-[13px] font-medium text-slate-700">No se pudo cargar el documento de Word.</p>
        </div>
      )}
      <div ref={containerRef} className="p-5 min-h-full" />
    </div>
  );
}
