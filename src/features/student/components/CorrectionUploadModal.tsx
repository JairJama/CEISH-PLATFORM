import { useRef, useState } from 'react';
import { MAX_MB, validatePdf } from '../../../services/storage';

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
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="correction-modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="correction-modal-title">Enviar informe de correcciones</h2>
          <button className="modal__close" onClick={onCancel} disabled={saving} aria-label="Cerrar">×</button>
        </div>
        <div className="modal__body">
          <button className={`upload-zone ${file ? 'upload-zone--has-file' : ''}`} type="button" onClick={() => inputRef.current?.click()} disabled={saving}>
            {file ? (
              <div className="upload-zone__preview">
                <div className="upload-zone__file-info">
                  <p className="upload-zone__file-name">{file.name}</p>
                  <p className="upload-zone__file-meta">PDF · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <span className="upload-zone__change">Cambiar</span>
              </div>
            ) : (
              <div className="upload-zone__empty">
                <p className="upload-zone__empty-title">Selecciona el informe en PDF</p>
                <p className="upload-zone__empty-desc">Tamaño máximo: {MAX_MB} MB</p>
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
          {error && <p className="upload-zone__error" role="alert">{error}</p>}
        </div>
        <div className="modal__footer">
          <button className="eval-btn eval-btn--outline" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button className="eval-btn eval-btn--primary" onClick={() => void submit()} disabled={!file || saving}>
            {saving ? 'Enviando...' : 'Enviar correcciones'}
          </button>
        </div>
      </div>
    </div>
  );
}
