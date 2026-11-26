import { useRef, useState } from 'react';
import { MAX_MB, validatePdf } from '../../../services/storage';
import { btnClass, modalLayout } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

interface Props {
  onConfirm: (file: File) => Promise<void>;
  onCancel: () => void;
}

export function CorrectionUploadModal({ onConfirm, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    const validationError = validatePdf(selected);
    setError(validationError);
    setFile(validationError ? null : selected);
  };

  const submit = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(file);
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  };

  return (
    <div
      className={modalLayout.backdrop}
      onClick={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}
    >
      <div className={modalLayout.panel} role="dialog" aria-modal="true" aria-labelledby="correction-modal-title">
        <div className={modalLayout.header}>
          <h2 className={modalLayout.title} id="correction-modal-title">Enviar informe de correcciones</h2>
          <button className={modalLayout.close} onClick={onCancel} disabled={saving} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>
        <div className={modalLayout.body}>
          <button
            className={cn(
              'w-full min-h-[100px] p-5 border-2 border-dashed rounded-lg cursor-pointer flex items-center justify-center transition-colors',
              file
                ? 'border-[#ef3e3a] bg-red-50/70'
                : 'border-slate-300 bg-slate-50/60 hover:border-[#ef3e3a] hover:bg-red-50/50',
            )}
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
          >
            {file ? (
              <div className="flex items-center gap-3.5 w-full text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">PDF · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <span className="text-[12px] font-semibold text-[#ef3e3a] whitespace-nowrap px-2 py-1 rounded hover:bg-red-100">
                  Cambiar
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-[13px] font-medium text-slate-800">Selecciona el informe en PDF</p>
                <p className="text-[12px] text-slate-500">Tamaño máximo: {MAX_MB} MB</p>
              </div>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => selectFile(event.target.files?.[0])}
            hidden
          />
          {error && <p className="mt-1 text-[12px] text-red-600" role="alert">{error}</p>}
        </div>
        <div className={modalLayout.footer}>
          <button className={btnClass('outline')} onClick={onCancel} disabled={saving} type="button">Cancelar</button>
          <button className={btnClass('primary')} onClick={() => void submit()} disabled={!file || saving} type="button">
            {saving ? 'Enviando...' : 'Enviar correcciones'}
          </button>
        </div>
      </div>
    </div>
  );
}
