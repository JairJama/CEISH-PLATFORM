import { query, withTransaction } from '../../lib/database';

export interface AdminResearchRow {
  submission_id: string;
  document_name: string;
  submitted_at: string;
  researcher_name: string;
  researcher_email: string;
  classification_status: string;
  risk_level: string | null;
  stratifier_id: string | null;
  stratifier_name: string | null;
  stratifier_email: string | null;
  stratification_decided_at: string | null;
  qualification_status: string | null;
  qualifier_id: string | null;
  qualifier_name: string | null;
  qualifier_email: string | null;
  annexes: Array<{
    id: string;
    annexNumber: 11 | 12 | 13 | 23 | 27;
    cycleNumber: number | null;
    revisionNumber: number | null;
    decision: string | null;
    createdAt: string;
    documentName: string;
    documentReady: boolean;
  }>;
}

export async function listAdminResearch(): Promise<AdminResearchRow[]> {
  return query<AdminResearchRow>(
    `SELECT s.id AS submission_id, s.document_name, s.submitted_at,
            researcher.name AS researcher_name, researcher.email AS researcher_email,
            s.classification_status, s.risk_level,
            sa.stratifier_id, stratifier.name AS stratifier_name,
            stratifier.email AS stratifier_email, sa.decided_at AS stratification_decided_at,
            qc.status AS qualification_status,
            qc.qualifier_id, qualifier.name AS qualifier_name, qualifier.email AS qualifier_email,
            COALESCE(annexes.items, '[]'::json) AS annexes
       FROM submissions s
       JOIN users researcher ON researcher.id = s.student_id
       LEFT JOIN stratification_assignments sa
         ON sa.submission_id = s.id AND sa.round_number = 1
       LEFT JOIN users stratifier ON stratifier.id = sa.stratifier_id
       LEFT JOIN qualification_cases qc ON qc.submission_id = s.id
       LEFT JOIN users qualifier ON qualifier.id = qc.qualifier_id
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'id', annex.id,
           'annexNumber', annex.annex_number,
           'cycleNumber', cycle.cycle_number,
           'revisionNumber', annex.data->'revisionNumber',
           'decision', annex.data->>'decision',
           'createdAt', annex.created_at,
           'documentName', COALESCE(annex.document_name, 'Anexo-' || annex.annex_number || '.docx'),
           'documentReady', annex.document_path IS NOT NULL
         ) ORDER BY annex.annex_number, annex.created_at) AS items
           FROM research_annexes annex
           LEFT JOIN qualification_cycles cycle ON cycle.id = annex.qualification_cycle_id
          WHERE annex.submission_id = s.id
            AND annex.status <> 'voided'
            AND annex.status = 'completed'
       ) annexes ON TRUE
      ORDER BY s.submitted_at DESC`,
  );
}

export type ReassignResult = 'reassigned' | 'locked' | 'not-found' | 'invalid-member';

const CEISH_INTERNAL_ROLE_SQL = "lower(regexp_replace(r.name, '[ -]+', '_', 'g')) IN ('teacher', 'evaluator', 'member', 'miembro', 'ceish', 'ceish_member', 'miembro_ceish')";

export async function reassignStratifier(
  submissionId: string,
  nextStratifierId: string,
): Promise<ReassignResult> {
  return withTransaction(async (client) => {
    const assignments = await client.query<{
      assignment_id: string;
      classification_status: string;
      risk_level: string | null;
    }>(
      `SELECT sa.id AS assignment_id, s.classification_status, sa.risk_level
         FROM submissions s
         JOIN stratification_assignments sa
           ON sa.submission_id = s.id AND sa.round_number = 1
        WHERE s.id = $1
        FOR UPDATE OF s, sa`,
      [submissionId],
    );
    const assignment = assignments.rows[0];
    if (!assignment) return 'not-found';
    if (assignment.classification_status !== 'awaiting-first' || assignment.risk_level !== null) return 'locked';

    const members = await client.query<{ id: string }>(
      `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1 AND ${CEISH_INTERNAL_ROLE_SQL}`,
      [nextStratifierId],
    );
    if (!members.rows[0]) return 'invalid-member';

    await client.query(
      `UPDATE stratification_assignments SET stratifier_id = $2, assigned_at = NOW()
        WHERE id = $1`,
      [assignment.assignment_id, nextStratifierId],
    );
    return 'reassigned';
  });
}

export async function reassignQualifier(
  submissionId: string,
  nextQualifierId: string,
): Promise<ReassignResult> {
  return withTransaction(async (client) => {
    const cases = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM qualification_cases
        WHERE submission_id = $1
        FOR UPDATE`,
      [submissionId],
    );
    const qualification = cases.rows[0];
    if (!qualification) return 'not-found';
    if (['approved', 'cancelled', 'expired'].includes(qualification.status)) return 'locked';
    const members = await client.query<{ id: string }>(
      `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1 AND ${CEISH_INTERNAL_ROLE_SQL}`,
      [nextQualifierId],
    );
    if (!members.rows[0]) return 'invalid-member';
    await client.query(
      `UPDATE qualification_cases SET qualifier_id = $2, updated_at = NOW() WHERE id = $1`,
      [qualification.id, nextQualifierId],
    );
    return 'reassigned';
  });
}

export type CancelResearchResult = 'cancelled' | 'closed' | 'not-found';

export async function cancelResearch(submissionId: string): Promise<CancelResearchResult> {
  return withTransaction(async (client) => {
    const submissions = await client.query<{
      id: string;
      classification_status: string;
      qualification_status: string | null;
    }>(
      `SELECT s.id, s.classification_status, qc.status AS qualification_status
         FROM submissions s
         LEFT JOIN qualification_cases qc ON qc.submission_id = s.id
        WHERE s.id = $1
        FOR UPDATE OF s`,
      [submissionId],
    );
    const submission = submissions.rows[0];
    if (!submission) return 'not-found';
    if (submission.classification_status === 'cancelled' || submission.qualification_status === 'approved') return 'closed';

    await client.query(
      `UPDATE submissions
          SET classification_status = 'cancelled', risk_level = NULL, classified_at = NULL
        WHERE id = $1`,
      [submission.id],
    );
    await client.query(
      `UPDATE qualification_cases
          SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW(), completed_at = NOW()
        WHERE submission_id = $1
          AND status NOT IN ('approved', 'cancelled', 'expired')`,
      [submission.id],
    );
    return 'cancelled';
  });
}
