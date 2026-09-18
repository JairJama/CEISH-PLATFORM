import { query, withTransaction } from '../../lib/database';

export type QualificationStatus =
  | 'pending-review'
  | 'corrections-required'
  | 'resubmitted'
  | 'approved'
  | 'cancelled'
  | 'expired';

export interface QualificationTaskRow {
  id: string;
  submission_id: string;
  qualifier_id: string;
  status: QualificationStatus;
  current_cycle: number;
  document_name: string;
  researcher_name: string;
  researcher_email: string;
  cycle_id: string;
  cycle_status: string;
  observations: string;
  correction_due_at: string | null;
  correction_document_name: string | null;
  correction_submitted_at: string | null;
  updated_at: string;
}

export async function expireOverdueQualifications(): Promise<void> {
  await query(
    `UPDATE qualification_cases qc
        SET status = 'expired', updated_at = NOW(), completed_at = NOW()
       FROM qualification_cycles cycle
      WHERE cycle.qualification_id = qc.id
        AND cycle.cycle_number = qc.current_cycle
        AND qc.status = 'corrections-required'
        AND cycle.correction_due_at < NOW()`,
  );
}

/** Recupera casos sin riesgo que pudieron clasificarse antes de crear su evaluación. */
export async function ensureQualificationCasesForNoRiskResearch(): Promise<void> {
  await query(
    `INSERT INTO qualification_cases (submission_id, qualifier_id)
     SELECT submission.id, assignment.stratifier_id
       FROM submissions submission
       JOIN stratification_assignments assignment
         ON assignment.submission_id = submission.id
        AND assignment.round_number = 1
      WHERE submission.classification_status = 'classified'
        AND submission.risk_level = 'no-risk'
     ON CONFLICT (submission_id) DO NOTHING`,
  );
  await query(
    `INSERT INTO qualification_cycles (qualification_id, cycle_number)
     SELECT qualification.id, 1
       FROM qualification_cases qualification
     ON CONFLICT (qualification_id, cycle_number) DO NOTHING`,
  );
}

export async function createQualificationCase(
  submissionId: string,
  qualifierId: string,
  client: import('pg').PoolClient,
): Promise<void> {
  const created = await client.query<{ id: string }>(
    `INSERT INTO qualification_cases (submission_id, qualifier_id)
     VALUES ($1, $2)
     ON CONFLICT (submission_id) DO NOTHING
     RETURNING id`,
    [submissionId, qualifierId],
  );
  if (created.rows[0]) {
    await client.query(
      `INSERT INTO qualification_cycles (qualification_id, cycle_number)
       VALUES ($1, 1)`,
      [created.rows[0].id],
    );
  }
}

export async function listQualificationTasks(qualifierId: string): Promise<QualificationTaskRow[]> {
  await ensureQualificationCasesForNoRiskResearch();
  await expireOverdueQualifications();
  return query<QualificationTaskRow>(
    `SELECT qc.id, qc.submission_id, qc.qualifier_id, qc.status, qc.current_cycle,
            qc.updated_at, s.document_name, researcher.name AS researcher_name,
            researcher.email AS researcher_email, cycle.id AS cycle_id,
            cycle.status AS cycle_status, cycle.observations,
            cycle.correction_due_at, cycle.correction_document_name,
            cycle.correction_submitted_at
       FROM qualification_cases qc
       JOIN submissions s ON s.id = qc.submission_id
       JOIN users researcher ON researcher.id = s.student_id
       JOIN qualification_cycles cycle
         ON cycle.qualification_id = qc.id AND cycle.cycle_number = qc.current_cycle
      WHERE qc.qualifier_id = $1
      ORDER BY (qc.status IN ('approved', 'cancelled', 'expired')), qc.updated_at DESC`,
    [qualifierId],
  );
}

export type ReviewResult = 'approved' | 'corrections-required' | 'closed' | 'not-found' | 'not-assigned';

export async function reviewQualification(
  qualificationId: string,
  qualifierId: string,
  hasObservations: boolean,
  observations: string,
): Promise<ReviewResult> {
  return withTransaction(async (client) => {
    const cases = await client.query<{
      id: string;
      qualifier_id: string;
      status: QualificationStatus;
      current_cycle: number;
      cycle_id: string;
    }>(
      `SELECT qc.id, qc.qualifier_id, qc.status, qc.current_cycle, cycle.id AS cycle_id
         FROM qualification_cases qc
         JOIN qualification_cycles cycle
           ON cycle.qualification_id = qc.id AND cycle.cycle_number = qc.current_cycle
        WHERE qc.id = $1
        FOR UPDATE OF qc, cycle`,
      [qualificationId],
    );
    const qualification = cases.rows[0];
    if (!qualification) return 'not-found';
    if (qualification.qualifier_id !== qualifierId) return 'not-assigned';
    if (!['pending-review', 'resubmitted'].includes(qualification.status)) return 'closed';

    if (!hasObservations) {
      await client.query(
        `UPDATE qualification_cycles
            SET status = 'approved', observations = '', reviewed_at = NOW()
          WHERE id = $1`,
        [qualification.cycle_id],
      );
      await client.query(
        `UPDATE qualification_cases
            SET status = 'approved', updated_at = NOW(), completed_at = NOW()
          WHERE id = $1`,
        [qualification.id],
      );
      return 'approved';
    }

    if (!observations.trim()) return 'closed';
    if (qualification.status === 'resubmitted') {
      await client.query(
        `UPDATE qualification_cycles SET status = 'reviewed', reviewed_at = NOW() WHERE id = $1`,
        [qualification.cycle_id],
      );
      const nextCycle = qualification.current_cycle + 1;
      await client.query(
        `INSERT INTO qualification_cycles
           (qualification_id, cycle_number, status, observations, correction_due_at, reviewed_at)
         VALUES ($1, $2, 'corrections-required', $3, NOW() + INTERVAL '30 days', NOW())`,
        [qualification.id, nextCycle, observations.trim()],
      );
      await client.query(
        `UPDATE qualification_cases
            SET status = 'corrections-required', current_cycle = $2, updated_at = NOW()
          WHERE id = $1`,
        [qualification.id, nextCycle],
      );
    } else {
      await client.query(
        `UPDATE qualification_cycles
            SET status = 'corrections-required', observations = $2,
                correction_due_at = NOW() + INTERVAL '30 days', reviewed_at = NOW()
          WHERE id = $1`,
        [qualification.cycle_id, observations.trim()],
      );
      await client.query(
        `UPDATE qualification_cases
            SET status = 'corrections-required', updated_at = NOW()
          WHERE id = $1`,
        [qualification.id],
      );
    }
    return 'corrections-required';
  });
}

export async function cancelQualification(
  qualificationId: string,
  qualifierId: string,
): Promise<boolean> {
  await expireOverdueQualifications();
  const rows = await query<{ id: string }>(
    `UPDATE qualification_cases
        SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW(), completed_at = NOW()
      WHERE id = $1 AND qualifier_id = $2
        AND status NOT IN ('approved', 'cancelled', 'expired')
      RETURNING id`,
    [qualificationId, qualifierId],
  );
  return rows.length > 0;
}

export type CorrectionResult = 'submitted' | 'expired' | 'closed' | 'not-found';

export async function submitCorrection(
  qualificationId: string,
  researcherId: string,
  documentName: string,
  documentPath: string,
): Promise<CorrectionResult> {
  return withTransaction(async (client) => {
    const cases = await client.query<{
      id: string;
      status: QualificationStatus;
      cycle_id: string;
      correction_due_at: string | null;
    }>(
      `SELECT qc.id, qc.status, cycle.id AS cycle_id, cycle.correction_due_at
         FROM qualification_cases qc
         JOIN submissions s ON s.id = qc.submission_id
         JOIN qualification_cycles cycle
           ON cycle.qualification_id = qc.id AND cycle.cycle_number = qc.current_cycle
        WHERE qc.id = $1 AND s.student_id = $2
        FOR UPDATE OF qc, cycle`,
      [qualificationId, researcherId],
    );
    const qualification = cases.rows[0];
    if (!qualification) return 'not-found';
    if (qualification.status !== 'corrections-required') return 'closed';
    if (!qualification.correction_due_at || new Date(qualification.correction_due_at).getTime() < Date.now()) {
      await client.query(
        `UPDATE qualification_cases
            SET status = 'expired', updated_at = NOW(), completed_at = NOW()
          WHERE id = $1`,
        [qualification.id],
      );
      return 'expired';
    }

    await client.query(
      `UPDATE qualification_cycles
          SET status = 'resubmitted', correction_document_name = $2,
              correction_document_path = $3, correction_submitted_at = NOW()
        WHERE id = $1`,
      [qualification.cycle_id, documentName, documentPath],
    );
    await client.query(
      `UPDATE qualification_cases SET status = 'resubmitted', updated_at = NOW() WHERE id = $1`,
      [qualification.id],
    );
    return 'submitted';
  });
}

export async function getCorrectionDocument(
  cycleId: string,
): Promise<{ document_path: string; submission_id: string; researcher_id: string; qualifier_id: string } | null> {
  const rows = await query<{
    document_path: string;
    submission_id: string;
    researcher_id: string;
    qualifier_id: string;
  }>(
    `SELECT cycle.correction_document_path AS document_path, qc.submission_id,
            s.student_id AS researcher_id, qc.qualifier_id
       FROM qualification_cycles cycle
       JOIN qualification_cases qc ON qc.id = cycle.qualification_id
       JOIN submissions s ON s.id = qc.submission_id
      WHERE cycle.id = $1 AND cycle.correction_document_path IS NOT NULL`,
    [cycleId],
  );
  return rows[0] ?? null;
}
