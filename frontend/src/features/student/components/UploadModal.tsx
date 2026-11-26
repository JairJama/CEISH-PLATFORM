import { useRef, useState } from 'react';
import { MAX_MB, validateResearchDocument } from '../../../services/storage';
import { btnClass, modalLayout } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

interface Props {
  onConfirm: (files: File[], title: string, comment: string) => void;
  onCancel: () => void;
  initialTitle?: string;
  initialComment?: string;
  mode?: 'create' | 'edit';
}

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
    <div className={modalLayout.backdrop} onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className={modalLayout.panel} role="dialog" aria-modal="true" aria-labelledby="research-upload-title">
        <div className={modalLayout.header}>
          <h2 className={modalLayout.title} id="research-upload-title">
            {mode === 'edit' ? 'Reemplazar documentos' : 'Subir investigación'}
          </h2>
          <button className={modalLayout.close} onClick={onCancel} aria-label="Cerrar" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={modalLayout.body}>
          <div className={modalLayout.field}>
            <label className={modalLayout.label} htmlFor="research-title">Título de la investigación</label>
            <input
              className={modalLayout.input}
              id="research-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Escribe el título completo"
              maxLength={300}
            />
          </div>

          <button
            className={cn(
              'w-full min-h-[100px] p-5 border-2 border-dashed rounded-lg cursor-pointer flex items-center justify-center transition-colors',
              files.length
                ? 'border-[#ef3e3a] bg-red-50/70'
                : 'border-slate-300 bg-slate-50/60 hover:border-[#ef3e3a] hover:bg-red-50/50',
            )}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect width="40" height="40" rx="10" fill="#fee2e2" />
                <path d="M20 12v16M12 20h16" stroke="#ef3e3a" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-[13px] font-medium text-slate-800">Adjunta los documentos Word o PDF de tu investigación</p>
              <p className="text-[12px] text-slate-500">
                .DOC, .DOCX o .PDF · sin límite de archivos · máx. {MAX_MB} MB cada uno
              </p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
            multiple
            onChange={handleFiles}
            hidden
          />
          {error && <p className="mt-1 text-[12px] text-red-600" role="alert">{error}</p>}

          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5 list-none m-0 p-0" aria-label="Documentos seleccionados">
              {files.map((file) => (
                <li
                  key={fileKey(file)}
                  className="flex items-center justify-between gap-3 px-3 py-2 border border-slate-200 rounded-md bg-slate-50"
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <strong className="truncate text-slate-900 text-[12px]">{file.name}</strong>
                    <span className="text-slate-500 text-[10px]">{formatBytes(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="border-0 text-[#d92f2c] bg-transparent text-[11px] font-bold cursor-pointer hover:underline"
                    onClick={() => removeFile(fileKey(file))}
                    aria-label={`Quitar ${file.name}`}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-slate-500 text-[12px] text-right" aria-live="polite">
            {files.length} {files.length === 1 ? 'documento seleccionado' : 'documentos seleccionados'}
          </p>

          <div className={modalLayout.field}>
            <label className={modalLayout.label} htmlFor="research-comment">Comentario (opcional)</label>
            <textarea
              className={modalLayout.textarea}
              id="research-comment"
              placeholder="Información adicional para el CEISH"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className={modalLayout.footer}>
          <button className={btnClass('outline')} onClick={onCancel} type="button">Cancelar</button>
          <button
            className={btnClass('primary')}
            onClick={() => onConfirm(files, title.trim(), comment.trim())}
            disabled={!canConfirm}
            type="button"
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Continuar al cuestionario'}
          </button>
        </div>
      </div>
    </div>
  );
}
