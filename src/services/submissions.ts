// Servicio de entregas que orquesta el almacenamiento del PDF (MinIO) y la
// persistencia de la referencia (PostgreSQL).
//
// El mapeo de tipos BD↔UI sigue centralizado en platformService; aquí solo se
// combina la subida del archivo con la creación/edición de la entrega.

import { storageService } from './storage';
import { platformService } from '../shared/services/platformService';
import type { StudentSubmission } from '../shared/types/platform.types';

export const submissionsService = {
  /** Entrega del estudiante (o null). */
  getForStudent(studentId: string): Promise<StudentSubmission | null> {
    return platformService.getSubmissionForStudent(studentId);
  },

  /** Investigaciones del investigador, desde la más reciente. */
  getAllForStudent(): Promise<StudentSubmission[]> {
    return platformService.getSubmissionsForStudent();
  },

  /** Sube el conjunto documental y crea la investigación. */
  async createWithDocuments(
    studentId: string,
    title: string,
    files: File[],
    comment: string,
  ): Promise<StudentSubmission> {
    const uploaded = await Promise.all(files.map((file) => storageService.uploadDocument(file)));
    const documents = uploaded.map((document) => ({
      documentName: document.documentName,
      documentPath: document.documentPath,
      mimeType: document.mimeType,
      sizeBytes: document.size,
    }));
    return platformService.createSubmission(studentId, title, comment, documents);
  },

  /** Reemplaza el conjunto documental de una investigación aún no revisada. */
  async updateWithDocuments(
    id: string,
    title: string,
    files: File[],
    comment: string,
  ): Promise<StudentSubmission> {
    const uploaded = await Promise.all(files.map((file) => storageService.uploadDocument(file)));
    const documents = uploaded.map((document) => ({
      documentName: document.documentName,
      documentPath: document.documentPath,
      mimeType: document.mimeType,
      sizeBytes: document.size,
    }));
    return platformService.updateSubmission(id, { title, comment, documents });
  },

  /** Solo actualiza el comentario, sin tocar el documento. */
  updateComment(id: string, comment: string): Promise<StudentSubmission> {
    return platformService.updateSubmission(id, { comment });
  },

  remove(id: string): Promise<void> {
    return platformService.deleteSubmission(id);
  },

  /** URL temporal para visualizar el documento. */
  getDocumentUrl(id: string): Promise<string> {
    return storageService.getDocumentUrl(id);
  },

  getResearchDocumentUrl(documentId: string): Promise<string> {
    return storageService.getResearchDocumentUrl(documentId);
  },
};
