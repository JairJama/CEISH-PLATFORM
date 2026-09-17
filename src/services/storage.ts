// Servicio de almacenamiento — el frontend sube y obtiene documentos PDF.
// El archivo viaja como multipart/form-data al middleware, que lo guarda en
// MinIO. El navegador nunca habla directamente con el object storage.

export interface UploadResult {
  documentPath: string;
  documentName: string;
  mimeType: string;
  size: number;
}

// Validaciones del lado del cliente (el servidor las revalida)
export const ACCEPTED_TYPE = 'application/pdf';
export const ACCEPTED_RESEARCH_EXTENSIONS = ['.doc', '.docx'] as const;
export const MAX_MB = 15;

export function validatePdf(file: File): string | null {
  const isPdf = file.type === ACCEPTED_TYPE || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return 'Solo se permiten archivos PDF.';
  if (file.size > MAX_MB * 1024 * 1024) return `El archivo supera el límite de ${MAX_MB} MB.`;
  return null;
}

export function validateResearchDocument(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  if (!ACCEPTED_RESEARCH_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
    return 'Solo se permiten documentos Word (.doc o .docx).';
  }
  if (file.size > MAX_MB * 1024 * 1024) return `El archivo supera el límite de ${MAX_MB} MB.`;
  return null;
}

async function unwrapError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new Error((body as { error?: string }).error ?? `Error ${res.status}`);
}

export const storageService = {
  /** Sube un PDF a MinIO y devuelve la referencia del objeto. */
  async uploadDocument(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) await unwrapError(res);
    return res.json() as Promise<UploadResult>;
  },

  /** Obtiene una URL temporal firmada para visualizar el documento de una entrega. */
  async getDocumentUrl(submissionId: string): Promise<string> {
    const res = await fetch(`/api/documents/${submissionId}`);
    if (!res.ok) await unwrapError(res);
    const data = (await res.json()) as { url: string };
    return data.url;
  },

  async getResearchDocumentUrl(documentId: string): Promise<string> {
    const res = await fetch(`/api/submission-documents/${documentId}`);
    if (!res.ok) await unwrapError(res);
    const data = (await res.json()) as { url: string };
    return data.url;
  },

  /** Ruta (mismo origen) que transmite el PDF; apta para incrustar en el visor. */
  getRawUrl(submissionId: string): string {
    return `/api/documents/${submissionId}/raw`;
  },
};
