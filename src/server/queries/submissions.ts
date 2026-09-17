// Consultas SQL del dominio de entregas (lado servidor).
import { randomInt } from 'node:crypto';
import { query, withTransaction } from '../../lib/database';

export interface SubmissionRow {
  id: string;
  student_id: string;
  student_name: string;
  research_code: string;
  title: string;
  document_name: string;
  document_path: string | null;
  comment: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  grade: number | null;
  final_comment: string | null;
  classification_status: string;
  risk_level: string | null;
  classified_at: string | null;
  qualification_id: string | null;
  qualification_status: string | null;
  qualification_cycle: number | null;
  qualification_observations: string | null;
  correction_due_at: string | null;
  documents: SubmissionDocumentRow[];
  annex_11_status: string | null;
}

export interface SubmissionDocumentRow {
  id: string;
  submission_id: string;
  document_name: string;
  document_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

const BASE_SELECT = `
  SELECT s.id, s.student_id, u.name AS student_name,
         s.research_code, s.title,
         s.document_name, s.document_path, s.comment, s.status,
         s.submitted_at, s.reviewed_at, s.grade, s.final_comment,
         s.classification_status, s.risk_level, s.classified_at,
         qc.id AS qualification_id, qc.status AS qualification_status,
         qc.current_cycle AS qualification_cycle,
         qcycle.observations AS qualification_observations,
         qcycle.correction_due_at,
         COALESCE(documents.items, '[]'::json) AS documents,
         annex11.status AS annex_11_status
    FROM submissions s
    JOIN users u ON u.id = s.student_id
    LEFT JOIN qualification_cases qc ON qc.submission_id = s.id
    LEFT JOIN qualification_cycles qcycle
      ON qcycle.qualification_id = qc.id AND qcycle.cycle_number = qc.current_cycle
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object(
        'id', d.id,
        'submission_id', d.submission_id,
        'document_name', d.document_name,
        'document_path', d.document_path,
        'mime_type', d.mime_type,
        'size_bytes', d.size_bytes,
        'uploaded_at', d.uploaded_at
      ) ORDER BY d.uploaded_at, d.id) AS items
        FROM submission_documents d
       WHERE d.submission_id = s.id
    ) documents ON TRUE
    LEFT JOIN research_annexes annex11
      ON annex11.submission_id = s.id
     AND annex11.annex_number = 11
     AND annex11.status <> 'voided'`;

export async function listSubmissions(): Promise<SubmissionRow[]> {
  return query<SubmissionRow>(`${BASE_SELECT} ORDER BY s.submitted_at DESC`);
}

export async function getSubmissionByStudent(studentId: string): Promise<SubmissionRow | null> {
  const rows = await query<SubmissionRow>(
    `${BASE_SELECT} WHERE s.student_id = $1 ORDER BY s.submitted_at DESC LIMIT 1`,
    [studentId],
  );
  return rows[0] ?? null;
}

export async function getSubmissionById(id: string): Promise<SubmissionRow | null> {
  const rows = await query<SubmissionRow>(`${BASE_SELECT} WHERE s.id = $1`, [id]);
  return rows[0] ?? null;
}

export interface CreateSubmissionInput {
  studentId: string;
  title: string;
  documents: Array<{
    documentName: string;
    documentPath: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  comment: string;
}

export async function createSubmission(input: CreateSubmissionInput): Promise<SubmissionRow> {
  const id = await withTransaction(async (client) => {
    const primaryDocument = input.documents[0];
    let created: { rows: Array<{ id: string; research_code: string }> } | null = null;
    for (let attempt = 0; attempt < 20 && !created?.rows.length; attempt += 1) {
      const researchCode = `CEISH-${randomInt(100_000).toString().padStart(5, '0')}`;
      created = await client.query<{ id: string; research_code: string }>(
        `INSERT INTO submissions
           (student_id, research_code, title, document_name, document_path, comment, status, classification_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'submitted', 'awaiting-assignment')
         ON CONFLICT (research_code) DO NOTHING
         RETURNING id, research_code`,
        [
          input.studentId,
          researchCode,
          input.title,
          primaryDocument.documentName,
          primaryDocument.documentPath,
          input.comment,
        ],
      );
    }
    if (!created?.rows.length) throw new Error('No se pudo generar un código CEISH único');
    const submissionId = created.rows[0].id;
    for (const document of input.documents) {
      await client.query(
        `INSERT INTO submission_documents
           (submission_id, document_name, document_path, mime_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5)`,
        [submissionId, document.documentName, document.documentPath, document.mimeType, document.sizeBytes],
      );
    }
    await client.query(
      `INSERT INTO research_annexes
         (submission_id, annex_number, status, data, created_by, completed_at)
       SELECT $1, 11, 'completed',
              jsonb_build_object(
                'researchCode', $2::text,
                'title', $3::text,
                'researcherName', u.name,
                'researcherEmail', u.email,
                'issuedAt', NOW(),
                'documents', $4::jsonb
              ),
              $5, NOW()
         FROM users u
        WHERE u.id = $5`,
      [
        submissionId,
        created.rows[0].research_code,
        input.title,
        JSON.stringify(input.documents.map((document) => ({
          name: document.documentName,
          sizeBytes: document.sizeBytes,
        }))),
        input.studentId,
      ],
    );
    const members = await client.query<{ id: string; active_count: string }>(
      `SELECT u.id, COUNT(sa.id) FILTER (WHERE s.classification_status <> 'classified') AS active_count
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN stratification_assignments sa ON sa.stratifier_id = u.id
         LEFT JOIN submissions s ON s.id = sa.submission_id
        WHERE r.name = 'teacher'
        GROUP BY u.id`,
    );
    if (members.rows.length) {
      const minimumLoad = Math.min(...members.rows.map((member) => Number(member.active_count)));
      const available = members.rows.filter((member) => Number(member.active_count) === minimumLoad);
      const selected = available[randomInt(available.length)];
      await client.query(
        `INSERT INTO stratification_assignments (submission_id, stratifier_id, round_number)
         VALUES ($1, $2, 1)`,
        [submissionId, selected.id],
      );
      await client.query(
        `UPDATE submissions SET classification_status = 'awaiting-first' WHERE id = $1`,
        [submissionId],
      );
    }
    return submissionId;
  });
  return (await getSubmissionById(id))!;
}

export async function updateSubmission(
  id: string,
  patch: {
    title?: string;
    comment?: string;
    documents?: CreateSubmissionInput['documents'];
  },
): Promise<SubmissionRow | null> {
  await withTransaction(async (client) => {
    const primaryDocument = patch.documents?.[0];
    await client.query(
      `UPDATE submissions
          SET title         = COALESCE($2, title),
              comment       = COALESCE($3, comment),
              document_name = COALESCE($4, document_name),
              document_path = COALESCE($5, document_path)
        WHERE id = $1`,
      [id, patch.title ?? null, patch.comment ?? null, primaryDocument?.documentName ?? null, primaryDocument?.documentPath ?? null],
    );
    if (patch.documents) {
      await client.query(`DELETE FROM submission_documents WHERE submission_id = $1`, [id]);
      for (const document of patch.documents) {
        await client.query(
          `INSERT INTO submission_documents
             (submission_id, document_name, document_path, mime_type, size_bytes)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, document.documentName, document.documentPath, document.mimeType, document.sizeBytes],
        );
      }
    }
    await client.query(
      `UPDATE research_annexes a
          SET data = a.data || jsonb_strip_nulls(jsonb_build_object(
                'title', $2::text,
                'documents', $3::jsonb
              )),
              updated_at = NOW()
        WHERE a.submission_id = $1 AND a.annex_number = 11 AND a.status <> 'voided'`,
      [
        id,
        patch.title ?? null,
        patch.documents ? JSON.stringify(patch.documents.map((document) => ({
          name: document.documentName,
          sizeBytes: document.sizeBytes,
        }))) : null,
      ],
    );
  });
  return getSubmissionById(id);
}

export async function getSubmissionDocument(id: string): Promise<SubmissionDocumentRow | null> {
  const rows = await query<SubmissionDocumentRow>(
    `SELECT id, submission_id, document_name, document_path, mime_type, size_bytes, uploaded_at
       FROM submission_documents
      WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/** Devuelve solo la clave del objeto almacenado para una entrega. */
export async function getDocumentPath(id: string): Promise<string | null> {
  const rows = await query<{ document_path: string | null }>(
    `SELECT document_path FROM submissions WHERE id = $1`,
    [id],
  );
  return rows[0]?.document_path ?? null;
}

export async function deleteSubmission(id: string): Promise<void> {
  await query(`DELETE FROM submissions WHERE id = $1`, [id]);
}
