import { generateAnnexDocx, type GeneratedAnnexData } from '../annexDocuments';
import { uploadDocument } from '../../lib/minio';
import { query } from '../../lib/database';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface AnnexSourceRow {
  id: string;
  annex_number: 11 | 23 | 27;
  data: Record<string, unknown>;
  research_code: string;
  title: string;
  researcher_id: string;
  researcher_name: string;
  completed_by: string | null;
  assignment_member_id: string | null;
  member_name: string | null;
  documents: Array<{ name: string; uploadedAt: string }>;
}

export interface AnnexDocumentRow {
  id: string;
  annex_number: 11 | 23 | 27;
  submission_id: string;
  researcher_id: string;
  completed_by: string | null;
  assignment_member_id: string | null;
  document_name: string | null;
  document_path: string | null;
}

async function getAnnexSource(annexId: string): Promise<AnnexSourceRow | null> {
  const rows = await query<AnnexSourceRow>(
    `SELECT annex.id, annex.annex_number, annex.data,
            submission.research_code, submission.title,
            researcher.id AS researcher_id, researcher.name AS researcher_name,
            annex.completed_by, assignment.stratifier_id AS assignment_member_id,
            COALESCE(completed_member.name, assignment_member.name) AS member_name,
            COALESCE(documents.items, '[]'::json) AS documents
       FROM research_annexes annex
       JOIN submissions submission ON submission.id = annex.submission_id
       JOIN users researcher ON researcher.id = submission.student_id
       LEFT JOIN stratification_assignments assignment ON assignment.id = annex.assignment_id
       LEFT JOIN users completed_member ON completed_member.id = annex.completed_by
       LEFT JOIN users assignment_member ON assignment_member.id = assignment.stratifier_id
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'name', document.document_name,
           'uploadedAt', document.uploaded_at
         ) ORDER BY document.uploaded_at, document.id) AS items
           FROM submission_documents document
          WHERE document.submission_id = submission.id
       ) documents ON TRUE
      WHERE annex.id = $1`,
    [annexId],
  );
  return rows[0] ?? null;
}

async function findAnnexIdForAssignment(assignmentId: string, annexNumber: 11 | 23 | 27): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `SELECT annex.id
       FROM research_annexes annex
      JOIN stratification_assignments assignment ON assignment.submission_id = annex.submission_id
      WHERE assignment.id = $1
        AND annex.annex_number = $2
        AND (annex.annex_number = 11 OR annex.assignment_id = assignment.id)
        AND annex.status <> 'voided'
      ORDER BY annex.created_at DESC
      LIMIT 1`,
    [assignmentId, annexNumber],
  );
  return rows[0]?.id ?? null;
}

async function findAnnexIdForSubmission(submissionId: string, annexNumber: 11 | 23 | 27): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM research_annexes
      WHERE submission_id = $1 AND annex_number = $2 AND status <> 'voided'
      ORDER BY created_at DESC
      LIMIT 1`,
    [submissionId, annexNumber],
  );
  return rows[0]?.id ?? null;
}

export async function regenerateAnnexDocument(annexId: string): Promise<AnnexDocumentRow | null> {
  const source = await getAnnexSource(annexId);
  if (!source) return null;
  const generated = await generateAnnexDocx({
    annexNumber: source.annex_number,
    researchCode: source.research_code,
    title: source.title,
    researcherName: source.researcher_name,
    memberName: source.member_name ?? 'Miembro CEISH-Uleam',
    data: source.data,
    documents: source.documents,
  } satisfies GeneratedAnnexData);
  const documentName = `Anexo-${source.annex_number}-${source.research_code}.docx`;
  const documentPath = await uploadDocument(generated, documentName, DOCX_MIME);
  await query(
    `UPDATE research_annexes
        SET document_name = $2, document_path = $3, document_updated_at = NOW(), updated_at = NOW()
      WHERE id = $1`,
    [annexId, documentName, documentPath],
  );
  return getAnnexDocument(annexId);
}

export async function regenerateAssignmentAnnexDocument(
  assignmentId: string,
  annexNumber: 11 | 23 | 27,
): Promise<AnnexDocumentRow | null> {
  const annexId = await findAnnexIdForAssignment(assignmentId, annexNumber);
  return annexId ? regenerateAnnexDocument(annexId) : null;
}

export async function regenerateSubmissionAnnexDocument(
  submissionId: string,
  annexNumber: 11 | 23 | 27,
): Promise<AnnexDocumentRow | null> {
  const annexId = await findAnnexIdForSubmission(submissionId, annexNumber);
  return annexId ? regenerateAnnexDocument(annexId) : null;
}

export async function getAnnexDocument(id: string): Promise<AnnexDocumentRow | null> {
  const rows = await query<AnnexDocumentRow>(
    `SELECT annex.id, annex.annex_number, annex.submission_id,
            submission.student_id AS researcher_id, annex.completed_by,
            assignment.stratifier_id AS assignment_member_id,
            annex.document_name, annex.document_path
       FROM research_annexes annex
       JOIN submissions submission ON submission.id = annex.submission_id
       LEFT JOIN stratification_assignments assignment ON assignment.id = annex.assignment_id
      WHERE annex.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
