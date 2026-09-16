// ============================================================================
// Plugin de Vite que expone un pequeño conjunto de rutas /api/* respaldadas
// por PostgreSQL y MinIO. Corre dentro del proceso Node del dev server de Vite
// — NO es un proyecto backend separado ni un framework (Express/Nest); es solo
// el punto donde el frontend (navegador) obtiene datos y archivos sin hablar
// TCP con la BD ni con el object storage.
// ============================================================================

import type { Plugin, Connect } from 'vite';
import type { ServerResponse } from 'node:http';
import busboy from 'busboy';

import { listUsers, listUsersByRole, getUserById } from './queries/users';
import {
  listSubmissions, getSubmissionByStudent, getSubmissionById,
  createSubmission, updateSubmission, deleteSubmission, getDocumentPath,
} from './queries/submissions';
import {
  listAssignments, listAssignmentsByTeacher, createAssignment, deleteAssignment,
} from './queries/assignments';
import { getReviewBySubmission, getOrCreateReview, saveReview } from './queries/reviews';
import { loginUser } from './queries/auth';
import { createRegistrationRequest, type ResearcherType } from './queries/registrationRequests';
import type { SaveReviewInput } from './queries/reviews';
import { uploadPdf, getPresignedUrl, getObjectStream } from '../lib/minio';
import { clearSession, getSession, setSession, type SessionUser } from './session';

const MAX_BYTES = Number(process.env.UPLOAD_MAX_MB ?? 15) * 1024 * 1024;

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function requireSession(req: Connect.IncomingMessage, res: ServerResponse): SessionUser | null {
  const session = getSession(req);
  if (!session) sendJson(res, 401, { error: 'Debes iniciar sesión para continuar' });
  return session;
}

function requireRole(req: Connect.IncomingMessage, res: ServerResponse, ...roles: SessionUser['role'][]): SessionUser | null {
  const session = requireSession(req, res);
  if (!session) return null;
  if (!roles.includes(session.role)) {
    sendJson(res, 403, { error: 'No tienes permiso para realizar esta acción' });
    return null;
  }
  return session;
}

async function canAccessSubmission(session: SessionUser, submissionId: string): Promise<boolean> {
  const submission = await getSubmissionById(submissionId);
  if (!submission) return false;
  if (session.role === 'admin') return true;
  if (session.role === 'student') return submission.student_id === session.id;
  return (await listAssignmentsByTeacher(session.id)).some((assignment) => assignment.student_id === submission.student_id);
}

/** Lee y parsea el cuerpo JSON de la petición. */
function readJsonBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

interface ParsedFile { buffer: Buffer; filename: string; mimeType: string }
interface ParsedMultipart { fields: Record<string, string>; file: ParsedFile | null; tooLarge: boolean }

/** Parsea un multipart/form-data con un único archivo (límite de tamaño aplicado). */
function parseMultipart(req: Connect.IncomingMessage): Promise<ParsedMultipart> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_BYTES } });
    const fields: Record<string, string> = {};
    let file: ParsedFile | null = null;
    let tooLarge = false;

    bb.on('field', (name, value) => { fields[name] = value; });
    bb.on('file', (_name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('limit', () => { tooLarge = true; });
      stream.on('end', () => {
        file = { buffer: Buffer.concat(chunks), filename: info.filename, mimeType: info.mimeType };
      });
    });
    bb.on('close', () => resolve({ fields, file, tooLarge }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

/** Resuelve una petición /api/* y devuelve true si la manejó. */
async function handle(req: Connect.IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '', 'http://localhost');
  const path = url.pathname;
  const method = (req.method ?? 'GET').toUpperCase();
  if (!path.startsWith('/api/')) return false;

  // ── Auth ───────────────────────────────────────────────────────────────
  if (path === '/api/auth/login' && method === 'POST') {
    const b = await readJsonBody(req);
    if (!b.email || !b.password) {
      sendJson(res, 400, { error: 'Email y contraseña son requeridos' });
      return true;
    }
    const user = await loginUser(String(b.email), String(b.password));
    if (!user) {
      sendJson(res, 401, { error: 'Credenciales incorrectas' });
      return true;
    }
    setSession(res, { id: user.id, role: user.role as SessionUser['role'] });
    sendJson(res, 200, { user });
    return true;
  }
  if (path === '/api/auth/register' && method === 'POST') {
    const b = await readJsonBody(req);
    const name = String(b.name ?? '').trim();
    const email = String(b.email ?? '').trim().toLowerCase();
    const password = String(b.password ?? '');
    const researcherType = b.researcherType;
    const affiliation = String(b.affiliation ?? '').trim();
    const validType = researcherType === 'internal' || researcherType === 'external';

    if (!name || !email || !password || !validType || (researcherType === 'external' && !affiliation)) {
      sendJson(res, 400, { error: 'Completa todos los campos requeridos' });
      return true;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sendJson(res, 400, { error: 'Ingresa un correo válido' });
      return true;
    }
    if (password.length < 8) {
      sendJson(res, 400, { error: 'La contraseña debe tener al menos 8 caracteres' });
      return true;
    }

    const created = await createRegistrationRequest({
      name,
      email,
      password,
      researcherType: researcherType as ResearcherType,
      affiliation: researcherType === 'internal' ? '' : affiliation,
    });
    if (!created) {
      sendJson(res, 409, { error: 'Ya existe una cuenta o una solicitud con este correo' });
      return true;
    }
    sendJson(res, 201, { message: 'Solicitud enviada. Te notificaremos cuando sea revisada.' });
    return true;
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    clearSession(res);
    sendJson(res, 200, { ok: true });
    return true;
  }
  if (path === '/api/auth/session' && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    const user = await getUserById(session.id);
    sendJson(res, user ? 200 : 401, user ? { ...user, role: user.role === 'teacher' ? 'evaluator' : user.role } : { error: 'La sesión ya no es válida' });
    return true;
  }

  // ── Users ──────────────────────────────────────────────────────────────
  if (path === '/api/users' && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    const role = url.searchParams.get('role');
    if (session.role === 'admin') {
      sendJson(res, 200, role ? await listUsersByRole(role) : await listUsers());
    } else if (session.role === 'evaluator') {
      const assignments = await listAssignmentsByTeacher(session.id);
      const students = await Promise.all(assignments.map((assignment) => getUserById(assignment.student_id)));
      sendJson(res, 200, students.filter((student): student is NonNullable<typeof student> => student !== null));
    } else {
      sendJson(res, 403, { error: 'No tienes permiso para consultar usuarios' });
    }
    return true;
  }
  const userMatch = path.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    if (session.role !== 'admin' && session.id !== userMatch[1]) {
      sendJson(res, 403, { error: 'No tienes permiso para consultar este usuario' });
      return true;
    }
    const user = await getUserById(userMatch[1]);
    sendJson(res, user ? 200 : 404, user ?? { error: 'Usuario no encontrado' });
    return true;
  }

  // ── Upload de documentos (multipart/form-data) ───────────────────────────
  // POST /api/upload  campo "file" -> sube a MinIO y devuelve la referencia
  if (path === '/api/upload' && method === 'POST') {
    if (!requireRole(req, res, 'student')) return true;
    const { file, tooLarge } = await parseMultipart(req);
    if (tooLarge) {
      sendJson(res, 413, { error: `El archivo supera el límite de ${MAX_BYTES / 1024 / 1024} MB` });
      return true;
    }
    if (!file) {
      sendJson(res, 400, { error: 'No se recibió ningún archivo' });
      return true;
    }
    const isPdf = file.mimeType === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      sendJson(res, 415, { error: 'Solo se permiten archivos PDF' });
      return true;
    }
    const documentPath = await uploadPdf(file.buffer, file.filename);
    sendJson(res, 201, { documentPath, documentName: file.filename, size: file.buffer.length });
    return true;
  }

  // GET /api/documents/:id/raw -> transmite el PDF (mismo origen, para incrustarlo)
  const docRawMatch = path.match(/^\/api\/documents\/([^/]+)\/raw$/);
  if (docRawMatch && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    if (!(await canAccessSubmission(session, docRawMatch[1]))) {
      sendJson(res, 403, { error: 'No tienes permiso para consultar este documento' });
      return true;
    }
    const key = await getDocumentPath(docRawMatch[1]);
    if (!key) {
      sendJson(res, 404, { error: 'La entrega no tiene documento asociado' });
      return true;
    }
    try {
      const stream = await getObjectStream(key);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      stream.on('error', () => { res.destroy(); });
      stream.pipe(res);
    } catch {
      sendJson(res, 404, { error: 'El documento no existe en el almacenamiento' });
    }
    return true;
  }

  // GET /api/documents/:id -> URL temporal firmada para visualizar el PDF
  const docMatch = path.match(/^\/api\/documents\/([^/]+)$/);
  if (docMatch && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    if (!(await canAccessSubmission(session, docMatch[1]))) {
      sendJson(res, 403, { error: 'No tienes permiso para consultar este documento' });
      return true;
    }
    const key = await getDocumentPath(docMatch[1]);
    if (!key) {
      sendJson(res, 404, { error: 'La entrega no tiene documento asociado' });
      return true;
    }
    const signedUrl = await getPresignedUrl(key);
    sendJson(res, 200, { url: signedUrl });
    return true;
  }

  // ── Submissions ────────────────────────────────────────────────────────
  if (path === '/api/submissions' && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    const studentId = url.searchParams.get('studentId');
    if (session.role === 'student') {
      sendJson(res, 200, await getSubmissionByStudent(session.id));
    } else if (session.role === 'evaluator') {
      const studentIds = (await listAssignmentsByTeacher(session.id)).map((assignment) => assignment.student_id);
      const submissions = await listSubmissions();
      sendJson(res, 200, submissions.filter((submission) => studentIds.includes(submission.student_id)));
    } else {
      sendJson(res, 200, studentId ? await getSubmissionByStudent(studentId) : await listSubmissions());
    }
    return true;
  }
  if (path === '/api/submissions' && method === 'POST') {
    const session = requireRole(req, res, 'student');
    if (!session) return true;
    const b = await readJsonBody(req);
    const created = await createSubmission({
      studentId: session.id,
      documentName: String(b.documentName),
      documentPath: (b.documentPath as string | undefined) ?? null,
      comment: String(b.comment ?? ''),
    });
    sendJson(res, 201, created);
    return true;
  }
  const subMatch = path.match(/^\/api\/submissions\/([^/]+)$/);
  if (subMatch && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    if (!(await canAccessSubmission(session, subMatch[1]))) {
      sendJson(res, 403, { error: 'No tienes permiso para consultar esta entrega' });
      return true;
    }
    const sub = await getSubmissionById(subMatch[1]);
    sendJson(res, sub ? 200 : 404, sub ?? { error: 'Entrega no encontrada' });
    return true;
  }
  if (subMatch && method === 'PATCH') {
    const session = requireRole(req, res, 'student');
    if (!session || !(await canAccessSubmission(session, subMatch[1]))) {
      if (session) sendJson(res, 403, { error: 'No puedes modificar esta entrega' });
      return true;
    }
    const current = await getSubmissionById(subMatch[1]);
    if (current?.status === 'reviewed') {
      sendJson(res, 409, { error: 'No se puede modificar una entrega ya revisada' });
      return true;
    }
    const b = await readJsonBody(req);
    const updated = await updateSubmission(subMatch[1], {
      documentName: b.documentName as string | undefined,
      comment: b.comment as string | undefined,
      documentPath: b.documentPath as string | undefined,
    });
    sendJson(res, updated ? 200 : 404, updated ?? { error: 'Entrega no encontrada' });
    return true;
  }
  if (subMatch && method === 'DELETE') {
    const session = requireRole(req, res, 'student');
    if (!session || !(await canAccessSubmission(session, subMatch[1]))) {
      if (session) sendJson(res, 403, { error: 'No puedes eliminar esta entrega' });
      return true;
    }
    const current = await getSubmissionById(subMatch[1]);
    if (current?.status === 'reviewed') {
      sendJson(res, 409, { error: 'No se puede eliminar una entrega ya revisada' });
      return true;
    }
    await deleteSubmission(subMatch[1]);
    sendJson(res, 200, { ok: true });
    return true;
  }

  // ── Assignments ──────────────────────────────────────────────────────────
  if (path === '/api/assignments' && method === 'GET') {
    const session = requireSession(req, res);
    if (!session) return true;
    const teacherId = url.searchParams.get('teacherId');
    if (session.role === 'evaluator') sendJson(res, 200, await listAssignmentsByTeacher(session.id));
    else if (session.role === 'admin') sendJson(res, 200, teacherId ? await listAssignmentsByTeacher(teacherId) : await listAssignments());
    else sendJson(res, 403, { error: 'No tienes permiso para consultar asignaciones' });
    return true;
  }
  if (path === '/api/assignments' && method === 'POST') {
    if (!requireRole(req, res, 'admin')) return true;
    const b = await readJsonBody(req);
    const created = await createAssignment(String(b.teacherId), String(b.studentId));
    sendJson(res, 201, created);
    return true;
  }
  const assignMatch = path.match(/^\/api\/assignments\/([^/]+)$/);
  if (assignMatch && method === 'DELETE') {
    if (!requireRole(req, res, 'admin')) return true;
    await deleteAssignment(assignMatch[1]);
    sendJson(res, 200, { ok: true });
    return true;
  }

  // ── Reviews ──────────────────────────────────────────────────────────────
  if (path === '/api/reviews' && method === 'POST') {
    const session = requireRole(req, res, 'evaluator');
    if (!session) return true;
    const b = await readJsonBody(req);
    if (!(await canAccessSubmission(session, String(b.submissionId)))) {
      sendJson(res, 403, { error: 'No tienes una asignación para esta entrega' });
      return true;
    }
    const review = await getOrCreateReview(String(b.submissionId), session.id);
    sendJson(res, 200, review);
    return true;
  }
  const reviewMatch = path.match(/^\/api\/reviews\/([^/]+)$/);
  if (reviewMatch && method === 'GET') {
    const session = requireSession(req, res);
    if (!session || !(await canAccessSubmission(session, reviewMatch[1]))) {
      if (session) sendJson(res, 403, { error: 'No tienes permiso para consultar esta revisión' });
      return true;
    }
    const review = await getReviewBySubmission(reviewMatch[1]);
    sendJson(res, review ? 200 : 404, review ?? { error: 'Revisión no encontrada' });
    return true;
  }
  if (reviewMatch && method === 'PUT') {
    const session = requireRole(req, res, 'evaluator');
    if (!session) return true;
    const b = await readJsonBody(req);
    const review = await getReviewBySubmission(String(b.submissionId));
    if (!review || review.id !== reviewMatch[1] || review.reviewer_id !== session.id) {
      sendJson(res, 403, { error: 'No puedes modificar esta revisión' });
      return true;
    }
    await saveReview(b as unknown as SaveReviewInput);
    sendJson(res, 200, { ok: true });
    return true;
  }

  sendJson(res, 404, { error: 'Ruta de API no encontrada' });
  return true;
}

export function apiPlugin(): Plugin {
  return {
    name: 'ceish-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        try {
          await handle(req, res);
        } catch (err) {
          console.error('[api] Error procesando', req.url, err);
          sendJson(res, 500, { error: 'Error interno del servidor' });
        }
      });
    },
  };
}
