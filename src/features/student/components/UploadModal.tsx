import { useRef, useState } from 'react';
import { MAX_MB, validateResearchDocument } from '../../../services/storage';

interface Props {
  onConfirm: (files: File[], title: string, comment: string) => void;
  onCancel: () => void;
  initialTitle?: string;
  initialComment?: string;
  mode?: 'create' | 'edit';
}

const MAX_FILES = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function UploadModal({
  onConfirm,
  onCancel,
  initialTitle = '',
  initialComment = '',
  mode = 'create',
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectFiles = (selected: File[]) => {
    const combined = [...files, ...selected]
      .filter((file, index, all) => all.findIndex((candidate) => fileKey(candidate) === fileKey(file)) === index);
    if (combined.length > MAX_FILES) {
      setError(`Puedes adjuntar hasta ${MAX_FILES} documentos.`);
      return;
    }
    const invalid = combined.find((file) => validateResearchDocument(file));
    if (invalid) {
      setError(`${invalid.name}: ${validateResearchDocument(invalid)}`);
      return;
    }
    setError(null);
    setFiles(combined);
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    selectFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (key: string) => {
    setFiles((current) => current.filter((file) => fileKey(file) !== key));
  };

  const canConfirm = files.length > 0 && title.trim().length > 0;

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="research-upload-title">
        <div className="modal__header">
          <h2 className="modal__title" id="research-upload-title">
            {mode === 'edit' ? 'Reemplazar documentos' : 'Enviar investigación'}
          </h2>
          <button className="modal__close" onClick={onCancel} aria-label="Cerrar" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__field">
            <label className="modal__label" htmlFor="research-title">Título de la investigación</label>
            <input
              className="modal__input"
              id="research-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Escribe el título completo"
              maxLength={300}
            />
          </div>

          <button
            className={`upload-zone upload-zone--multiple ${files.length ? 'upload-zone--has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <div className="upload-zone__empty">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect width="40" height="40" rx="10" fill="#f1f5f9" />
                <path d="M20 12v16M12 20h16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="upload-zone__empty-title">Adjunta uno o varios documentos Word</p>
              <p className="upload-zone__empty-desc">
                .DOC o .DOCX · hasta {MAX_FILES} archivos · máx. {MAX_MB} MB cada uno
              </p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            onChange={handleFiles}
            hidden
          />
          {error && <p className="upload-zone__error" role="alert">{error}</p>}

          {files.length > 0 && (
            <ul className="upload-file-list" aria-label="Documentos seleccionados">
              {files.map((file) => (
                <li key={fileKey(file)}>
                  <div>
                    <strong>{file.name}</strong>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(fileKey(file))} aria-label={`Quitar ${file.name}`}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="modal__field">
            <label className="modal__label" htmlFor="research-comment">Comentario (opcional)</label>
            <textarea
              className="modal__textarea"
              id="research-comment"
              placeholder="Información adicional para el CEISH"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal__footer">
          <button className="eval-btn eval-btn--outline" onClick={onCancel} type="button">Cancelar</button>
          <button
            className="eval-btn eval-btn--primary"
            onClick={() => onConfirm(files, title.trim(), comment.trim())}
            disabled={!canConfirm}
            type="button"
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Enviar investigación'}
          </button>
        </div>
      </div>
    </div>
  );
}
