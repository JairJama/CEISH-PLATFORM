import { randomInt } from 'node:crypto';
import { query, withTransaction } from '../../lib/database';
import type { SubmissionDocumentRow } from './submissions';
import { createQualificationCase } from './qualifications';

export type RiskLevel = 'no-risk' | 'minimal-risk' | 'greater-than-minimal';

export interface NoRiskCriterionInput {
  indicator: string;
  answer: 'yes' | 'no';
  observations: string;
}

export interface Annex27Input {
  researchType: string;
  location: string;
  responsibleInstitutions: string;
  principalInvestigatorId: string;
  principalInvestigatorDegree: string;
  criteria: NoRiskCriterionInput[];
}

export interface StratificationTaskRow {
  id: string;
  submission_id: string;
  stratifier_id: string;
  round_number: number;
  risk_level: RiskLevel | null;
  assigned_at: string;
  decided_at: string | null;
  research_code: string;
  title: string;
  document_name: string;
  researcher_name: string;
  researcher_email: string;
  classification_status: string;
  final_risk_level: RiskLevel | null;
  documents: SubmissionDocumentRow[];
  annex_11_id: string | null;
  annex_11_status: string | null;
  annex_11_data: Record<string, unknown> | null;
  annex_23_id: string | null;
  has_conflict: boolean | null;
  conflict_data: Record<string, unknown> | null;
  annex_27_id: string | null;
  annex_27_status: string | null;
  annex_27_data: Record<string, unknown> | null;
}

export async function listStratificationTasks(stratifierId: string): Promise<StratificationTaskRow[]> {
  return query<StratificationTaskRow>(
    `SELECT sa.id, sa.submission_id, sa.stratifier_id, sa.round_number,
            sa.risk_level, sa.assigned_at, sa.decided_at,
            s.research_code, s.title, s.document_name,
            u.name AS researcher_name, u.email AS researcher_email,
            s.classification_status, s.risk_level AS final_risk_level,
            COALESCE(documents.items, '[]'::json) AS documents,
            annex11.id AS annex_11_id,
            annex11.status AS annex_11_status,
            annex11.data AS annex_11_data,
            annex23.id AS annex_23_id,
            CASE
              WHEN annex23.id IS NULL THEN NULL
              ELSE (annex23.data->>'hasConflict')::boolean
            END AS has_conflict,
            annex23.data AS conflict_data,
            annex27.id AS annex_27_id,
            annex27.status AS annex_27_status,
            annex27.data AS annex_27_data
       FROM stratification_assignments sa
       JOIN submissions s ON s.id = sa.submission_id
       JOIN users u ON u.id = s.student_id
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
        AND annex11.status <> 'voided'
       LEFT JOIN LATERAL (
         SELECT a.id, a.data
           FROM research_annexes a
          WHERE a.assignment_id = sa.id
            AND a.annex_number = 23
            AND a.status = 'completed'
            AND a.completed_by = sa.stratifier_id
          ORDER BY a.completed_at DESC, a.created_at DESC
          LIMIT 1
       ) annex23 ON TRUE
       LEFT JOIN research_annexes annex27
         ON annex27.assignment_id = sa.id
        AND annex27.annex_number = 27
        AND annex27.status <> 'voided'
      WHERE sa.stratifier_id = $1
      ORDER BY (s.classification_status = 'classified'), sa.assigned_at DESC`,
    [stratifierId],
  );
}

export async function hasStratificationAssignment(stratifierId: string, submissionId: string): Promise<boolean> {
  const rows = await query(
    `SELECT 1 FROM stratification_assignments
      WHERE stratifier_id = $1 AND submission_id = $2 LIMIT 1`,
    [stratifierId, submissionId],
  );
  return rows.length > 0;
}

export async function updateAnnex11(
  assignmentId: string,
  stratifierId: string,
  data: Record<string, unknown>,
): Promise<'draft' | 'completed' | null> {
  const rows = await query<{ status: 'draft' | 'completed' }>(
    `UPDATE research_annexes annex
        SET data = annex.data || $3::jsonb,
            updated_at = NOW()
       FROM stratification_assignments assignment
      WHERE assignment.id = $1
        AND assignment.stratifier_id = $2
        AND annex.submission_id = assignment.submission_id
        AND annex.annex_number = 11
        AND annex.status <> 'voided'
      RETURNING annex.status`,
    [assignmentId, stratifierId, JSON.stringify(data)],
  );
  return rows[0]?.status ?? null;
}

export type ConflictResult = 'cleared' | 'reassigned' | 'unavailable' | 'closed' | 'not-found';

export async function declareStratificationConflict(
  assignmentId: string,
  stratifierId: string,
  input: { placeDate: string; hasConflict: boolean; details: string },
): Promise<ConflictResult> {
  return withTransaction(async (client) => {
    const result = await client.query<{
      id: string;
      submission_id: string;
      classification_status: string;
      member_name: string;
      research_code: string;
      title: string;
    }>(
      `SELECT sa.id, sa.submission_id, s.classification_status,
              member.name AS member_name, s.research_code, s.title
         FROM stratification_assignments sa
         JOIN submissions s ON s.id = sa.submission_id
         JOIN users member ON member.id = sa.stratifier_id
        WHERE sa.id = $1 AND sa.stratifier_id = $2
        FOR UPDATE OF sa, s`,
      [assignmentId, stratifierId],
    );
    const assignment = result.rows[0];
    if (!assignment) return 'not-found';
    if (['classified', 'cancelled'].includes(assignment.classification_status)) return 'closed';

    await client.query(
      `INSERT INTO research_annexes
         (submission_id, assignment_id, annex_number, status, data, created_by, completed_by, completed_at)
       VALUES ($1, $2, 23, 'completed', $3::jsonb, $4, $4, NOW())`,
      [
        assignment.submission_id,
        assignment.id,
        JSON.stringify({
          placeDate: input.placeDate,
          hasConflict: input.hasConflict,
          details: input.details,
          memberName: assignment.member_name,
          researchCode: assignment.research_code,
          researchTitle: assignment.title,
        }),
        stratifierId,
      ],
    );

    if (!input.hasConflict) {
      await client.query(
        `INSERT INTO research_annexes
           (submission_id, assignment_id, annex_number, status, data, created_by)
         VALUES ($1, $2, 27, 'draft', '{}'::jsonb, $3)
         ON CONFLICT (assignment_id, annex_number)
           WHERE annex_number = 27 AND status <> 'voided'
         DO NOTHING`,
        [assignment.submission_id, assignment.id, stratifierId],
      );
      return 'cleared';
    }

    const candidates = await client.query<{ id: string; active_count: string }>(
      `SELECT candidate.id,
              COUNT(active_assignment.id) FILTER (
                WHERE active_submission.classification_status NOT IN ('classified', 'cancelled')
              ) AS active_count
         FROM users candidate
         JOIN roles role ON role.id = candidate.role_id AND role.name = 'teacher'
         LEFT JOIN stratification_assignments active_assignment
           ON active_assignment.stratifier_id = candidate.id
         LEFT JOIN submissions active_submission
           ON active_submission.id = active_assignment.submission_id
        WHERE candidate.id <> $1
          AND NOT EXISTS (
            SELECT 1
              FROM research_annexes conflict
             WHERE conflict.submission_id = $2
               AND conflict.annex_number = 23
               AND conflict.completed_by = candidate.id
               AND conflict.status = 'completed'
               AND conflict.data->>'hasConflict' = 'true'
          )
        GROUP BY candidate.id`,
      [stratifierId, assignment.submission_id],
    );
    if (!candidates.rows.length) {
      await client.query(
        `UPDATE submissions SET classification_status = 'awaiting-assignment' WHERE id = $1`,
        [assignment.submission_id],
      );
      return 'unavailable';
    }

    const minimumLoad = Math.min(...candidates.rows.map((candidate) => Number(candidate.active_count)));
    const available = candidates.rows.filter((candidate) => Number(candidate.active_count) === minimumLoad);
    const selected = available[randomInt(available.length)];
    await client.query(
      `UPDATE stratification_assignments
          SET stratifier_id = $2, assigned_at = NOW(), risk_level = NULL, decided_at = NULL
        WHERE id = $1`,
      [assignment.id, selected.id],
    );
    await client.query(
      `UPDATE submissions
          SET classification_status = 'awaiting-first', risk_level = NULL, classified_at = NULL
        WHERE id = $1`,
      [assignment.submission_id],
    );
    return 'reassigned';
  });
}

export type SaveDecisionResult = 'classified' | 'closed' | 'conflict-required' | 'not-found';

export async function saveStratificationDecision(
  assignmentId: string,
  stratifierId: string,
  annex: Annex27Input,
): Promise<SaveDecisionResult> {
  return withTransaction(async (client) => {
    const assignmentResult = await client.query<{
      id: string;
      submission_id: string;
      classification_status: string;
      conflict_cleared: boolean;
      annex_27_id: string | null;
    }>(
      `SELECT sa.id, sa.submission_id, s.classification_status,
              EXISTS (
                SELECT 1
                  FROM research_annexes declaration
                 WHERE declaration.assignment_id = sa.id
                   AND declaration.annex_number = 23
                   AND declaration.status = 'completed'
                   AND declaration.completed_by = sa.stratifier_id
                   AND declaration.data->>'hasConflict' = 'false'
              ) AS conflict_cleared,
              annex27.id AS annex_27_id
         FROM stratification_assignments sa
         JOIN submissions s ON s.id = sa.submission_id
         LEFT JOIN research_annexes annex27
           ON annex27.assignment_id = sa.id
          AND annex27.annex_number = 27
          AND annex27.status <> 'voided'
        WHERE sa.id = $1 AND sa.stratifier_id = $2
        FOR UPDATE OF sa, s`,
      [assignmentId, stratifierId],
    );
    const assignment = assignmentResult.rows[0];
    if (!assignment) return 'not-found';
    if (assignment.classification_status === 'cancelled') return 'closed';
    if (!assignment.conflict_cleared || !assignment.annex_27_id) return 'conflict-required';

    await client.query(
      `UPDATE research_annexes
          SET status = 'completed', data = $2::jsonb,
              completed_by = $3, completed_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [
        assignment.annex_27_id,
        JSON.stringify({ ...annex, finalRiskLevel: 'no-risk' }),
        stratifierId,
      ],
    );
    await client.query(
      `UPDATE research_annexes
          SET status = 'completed', completed_by = $2,
              completed_at = NOW(), updated_at = NOW(),
              data = data || jsonb_build_object('issuedAt', NOW())
        WHERE submission_id = $1
          AND annex_number = 11
          AND status <> 'voided'`,
      [assignment.submission_id, stratifierId],
    );
    await client.query(
      `UPDATE stratification_assignments
          SET risk_level = 'no-risk', decided_at = NOW()
        WHERE id = $1`,
      [assignment.id],
    );
    await client.query(
      `UPDATE submissions
          SET classification_status = 'classified', risk_level = 'no-risk', classified_at = NOW()
        WHERE id = $1`,
      [assignment.submission_id],
    );
    // Por defecto, quien estratificó el caso continúa como evaluador.
    // Administración puede reasignar esta responsabilidad después.
    await createQualificationCase(assignment.submission_id, stratifierId, client);
    return 'classified';
  });
}
