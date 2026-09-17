import { randomInt } from 'node:crypto';
import { query, withTransaction } from '../../lib/database';

export type RiskLevel = 'no-risk' | 'minimal-risk' | 'greater-than-minimal';

export interface StratificationTaskRow {
  id: string;
  submission_id: string;
  stratifier_id: string;
  round_number: number;
  risk_level: RiskLevel | null;
  assigned_at: string;
  decided_at: string | null;
  document_name: string;
  researcher_name: string;
  researcher_email: string;
  classification_status: string;
  final_risk_level: RiskLevel | null;
  other_risk_level: RiskLevel | null;
}

export async function listStratificationTasks(stratifierId: string): Promise<StratificationTaskRow[]> {
  return query<StratificationTaskRow>(
    `SELECT sa.id, sa.submission_id, sa.stratifier_id, sa.round_number,
            sa.risk_level, sa.assigned_at, sa.decided_at,
            s.document_name, u.name AS researcher_name, u.email AS researcher_email,
            s.classification_status, s.risk_level AS final_risk_level,
            other.risk_level AS other_risk_level
       FROM stratification_assignments sa
       JOIN submissions s ON s.id = sa.submission_id
       JOIN users u ON u.id = s.student_id
       LEFT JOIN stratification_assignments other
         ON other.submission_id = sa.submission_id AND other.id <> sa.id
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

export type SaveDecisionResult = 'saved' | 'classified' | 'unavailable' | 'closed' | 'not-found';

export async function saveStratificationDecision(
  assignmentId: string,
  stratifierId: string,
  riskLevel: RiskLevel,
): Promise<SaveDecisionResult> {
  return withTransaction(async (client) => {
    const assignmentResult = await client.query<{
      id: string;
      submission_id: string;
      round_number: number;
      classification_status: string;
    }>(
      `SELECT sa.id, sa.submission_id, sa.round_number, s.classification_status
         FROM stratification_assignments sa
         JOIN submissions s ON s.id = sa.submission_id
        WHERE sa.id = $1 AND sa.stratifier_id = $2
        FOR UPDATE OF sa, s`,
      [assignmentId, stratifierId],
    );
    const assignment = assignmentResult.rows[0];
    if (!assignment) return 'not-found';
    if (assignment.classification_status === 'classified') return 'closed';

    await client.query(
      `UPDATE stratification_assignments
          SET risk_level = $2, decided_at = NOW()
        WHERE id = $1`,
      [assignment.id, riskLevel],
    );

    if (assignment.round_number === 1 && riskLevel === 'no-risk') {
      await client.query(
        `UPDATE submissions
            SET classification_status = 'classified', risk_level = $2, classified_at = NOW()
          WHERE id = $1`,
        [assignment.submission_id, riskLevel],
      );
      return 'classified';
    }

    if (assignment.round_number === 1) {
      const second = await client.query<{ id: string }>(
        `SELECT id FROM stratification_assignments
          WHERE submission_id = $1 AND round_number = 2`,
        [assignment.submission_id],
      );
      if (!second.rows.length) {
        const candidates = await client.query<{ id: string; active_count: string }>(
          `SELECT u.id, COUNT(sa.id) FILTER (WHERE s.classification_status <> 'classified') AS active_count
             FROM users u
             JOIN roles r ON r.id = u.role_id
             LEFT JOIN stratification_assignments sa ON sa.stratifier_id = u.id
             LEFT JOIN submissions s ON s.id = sa.submission_id
            WHERE r.name = 'teacher' AND u.id <> $1
            GROUP BY u.id`,
          [stratifierId],
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
          `INSERT INTO stratification_assignments (submission_id, stratifier_id, round_number)
           VALUES ($1, $2, 2)`,
          [assignment.submission_id, selected.id],
        );
      }
      await client.query(
        `UPDATE submissions
            SET classification_status = 'awaiting-second', risk_level = NULL, classified_at = NULL
          WHERE id = $1`,
        [assignment.submission_id],
      );
      return 'saved';
    }

    const first = await client.query<{ risk_level: RiskLevel | null }>(
      `SELECT risk_level FROM stratification_assignments
        WHERE submission_id = $1 AND round_number = 1`,
      [assignment.submission_id],
    );
    if (first.rows[0]?.risk_level === riskLevel) {
      await client.query(
        `UPDATE submissions
            SET classification_status = 'classified', risk_level = $2, classified_at = NOW()
          WHERE id = $1`,
        [assignment.submission_id, riskLevel],
      );
      return 'classified';
    }
    await client.query(
      `UPDATE submissions
          SET classification_status = 'awaiting-consensus', risk_level = NULL, classified_at = NULL
        WHERE id = $1`,
      [assignment.submission_id],
    );
    return 'saved';
  });
}
