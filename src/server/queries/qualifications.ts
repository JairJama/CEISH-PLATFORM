import { query, withTransaction } from '../../lib/database';
import {
  ANNEX_12_CRITERIA,
  type Annex12ChecklistItem,
  type Annex12CriterionResult,
} from '../../shared/annex12';

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
  annexes: QualificationAnnexRow[];
}

export interface QualificationAnnexRow {
  id: string;
  annexNumber: 12 | 13;
  cycleNumber: number | null;
  revisionNumber: number | null;
  decision: string | null;
  createdAt: string;
  documentName: string;
  documentReady: boolean;
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
            cycle.correction_submitted_at,
            COALESCE(annexes.items, '[]'::json) AS annexes
       FROM qualification_cases qc
       JOIN submissions s ON s.id = qc.submission_id
       JOIN users researcher ON researcher.id = s.student_id
       JOIN qualification_cycles cycle
         ON cycle.qualification_id = qc.id AND cycle.cycle_number = qc.current_cycle
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'id', annex.id,
           'annexNumber', annex.annex_number,
           'cycleNumber', linked_cycle.cycle_number,
           'revisionNumber', annex.data->'revisionNumber',
           'decision', annex.data->>'decision',
           'createdAt', annex.created_at,
           'documentName', COALESCE(annex.document_name, 'Anexo-' || annex.annex_number || '.docx'),
           'documentReady', annex.document_path IS NOT NULL
         ) ORDER BY annex.created_at, annex.id) AS items
           FROM research_annexes annex
           LEFT JOIN qualification_cycles linked_cycle ON linked_cycle.id = annex.qualification_cycle_id
          WHERE annex.submission_id = qc.submission_id
            AND annex.annex_number IN (12, 13)
            AND annex.status = 'completed'
       ) annexes ON TRUE
      WHERE qc.qualifier_id = $1
      ORDER BY (qc.status IN ('approved', 'cancelled', 'expired')), qc.updated_at DESC`,
    [qualifierId],
  );
}

export type QualificationReviewDecision = 'approved' | 'corrections-required' | 'cancelled';

export interface QualificationReviewInput {
  decision: QualificationReviewDecision;
  observations: string;
  checklist: Array<{
    id: string;
    result: Annex12CriterionResult;
    observations: string;
  }>;
}

export type ReviewResult =
  | 'approved'
  | 'corrections-required'
  | 'cancelled'
  | 'closed'
  | 'not-found'
  | 'not-assigned'
  | 'invalid-checklist'
  | 'invalid-cancellation';

export interface QualificationReviewOutcome {
  result: ReviewResult;
  annexIds: string[];
}

function normalizeChecklist(input: QualificationReviewInput['checklist']): Annex12ChecklistItem[] | null {
  const allowedResults = new Set<Annex12CriterionResult>(['complies', 'does-not-comply', 'not-applicable']);
  const byId = new Map(input.map((item) => [item.id, item]));
  if (byId.size !== ANNEX_12_CRITERIA.length || input.length !== ANNEX_12_CRITERIA.length) return null;
  const normalized: Annex12ChecklistItem[] = [];
  for (const definition of ANNEX_12_CRITERIA) {
    const item = byId.get(definition.id);
    if (!item || !allowedResults.has(item.result)) return null;
    normalized.push({
      ...definition,
      result: item.result,
      observations: String(item.observations ?? '').trim(),
    });
  }
  return normalized;
}

export async function reviewQualification(
  qualificationId: string,
  qualifierId: string,
  input: QualificationReviewInput,
): Promise<QualificationReviewOutcome> {
  const checklist = normalizeChecklist(input.checklist);
  if (!checklist) return { result: 'invalid-checklist', annexIds: [] };
  const observations = input.observations.trim();
  const hasObservations = input.decision !== 'approved';
  if (hasObservations && (!observations || !checklist.some((item) => item.result === 'does-not-comply'))) {
    return { result: 'invalid-checklist', annexIds: [] };
  }
  if (!hasObservations && checklist.some((item) => item.result === 'does-not-comply')) {
    return { result: 'invalid-checklist', annexIds: [] };
  }
  return withTransaction(async (client) => {
    const cases = await client.query<{
      id: string;
      submission_id: string;
      qualifier_id: string;
      status: QualificationStatus;
      current_cycle: number;
      cycle_id: string;
      title: string;
      research_code: string;
      submitted_at: string;
      researcher_name: string;
      affiliation: string;
    }>(
      `SELECT qc.id, qc.submission_id, qc.qualifier_id, qc.status, qc.current_cycle,
              cycle.id AS cycle_id, submission.title, submission.research_code,
              submission.submitted_at, researcher.name AS researcher_name,
              COALESCE(profile.affiliation, '') AS affiliation
         FROM qualification_cases qc
         JOIN submissions submission ON submission.id = qc.submission_id
         JOIN users researcher ON researcher.id = submission.student_id
         LEFT JOIN researcher_profiles profile ON profile.user_id = researcher.id
         JOIN qualification_cycles cycle
           ON cycle.qualification_id = qc.id AND cycle.cycle_number = qc.current_cycle
        WHERE qc.id = $1
        FOR UPDATE OF qc, cycle`,
      [qualificationId],
    );
    const qualification = cases.rows[0];
    if (!qualification) return { result: 'not-found', annexIds: [] };
    if (qualification.qualifier_id !== qualifierId) return { result: 'not-assigned', annexIds: [] };
    if (!['pending-review', 'resubmitted'].includes(qualification.status)) {
      return { result: 'closed', annexIds: [] };
    }
    if (input.decision === 'cancelled' && qualification.status !== 'resubmitted') {
      return { result: 'invalid-cancellation', annexIds: [] };
    }

    let annexCycleId = qualification.cycle_id;
    let annexCycleNumber = qualification.current_cycle;

    if (input.decision === 'approved') {
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
    } else if (input.decision === 'cancelled') {
      await client.query(
        `UPDATE qualification_cycles
            SET status = 'reviewed', observations = $2, reviewed_at = NOW()
          WHERE id = $1`,
        [qualification.cycle_id, observations],
      );
      await client.query(
        `UPDATE qualification_cases
            SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW(), completed_at = NOW()
          WHERE id = $1`,
        [qualification.id],
      );
    } else {
      if (qualification.status === 'resubmitted') {
        await client.query(
          `UPDATE qualification_cycles SET status = 'reviewed', reviewed_at = NOW() WHERE id = $1`,
          [qualification.cycle_id],
        );
        const nextCycle = qualification.current_cycle + 1;
        const createdCycle = await client.query<{ id: string }>(
          `INSERT INTO qualification_cycles
             (qualification_id, cycle_number, status, observations, correction_due_at, reviewed_at)
           VALUES ($1, $2, 'corrections-required', $3, NOW() + INTERVAL '30 days', NOW())
           RETURNING id`,
          [qualification.id, nextCycle, observations],
        );
        annexCycleId = createdCycle.rows[0].id;
        annexCycleNumber = nextCycle;
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
          [qualification.cycle_id, observations],
        );
        await client.query(
          `UPDATE qualification_cases
              SET status = 'corrections-required', updated_at = NOW()
            WHERE id = $1`,
          [qualification.id],
        );
      }
    }

    const priorAnnexes = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM research_annexes
        WHERE submission_id = $1 AND annex_number = 12 AND status <> 'voided'`,
      [qualification.submission_id],
    );
    const revisionNumber = Number(priorAnnexes.rows[0]?.count ?? 0) + 1;
    const reviewedAt = new Date().toISOString();
    const annex12Data = {
      revisionNumber,
      cycleNumber: annexCycleNumber,
      decision: input.decision,
      hasObservations,
      generalObservations: observations,
      checklist,
      affiliation: qualification.affiliation,
      researchType: 'Investigación sin riesgo',
      receivedAt: qualification.submitted_at,
      reviewedAt,
    };
    const annex12 = await client.query<{ id: string }>(
      `INSERT INTO research_annexes
         (submission_id, qualification_cycle_id, annex_number, status, data,
          created_by, completed_by, completed_at)
       VALUES ($1, $2, 12, 'completed', $3::jsonb, $4, $4, NOW())
       RETURNING id`,
      [qualification.submission_id, annexCycleId, JSON.stringify(annex12Data), qualifierId],
    );
    const annexIds = [annex12.rows[0].id];

    if (input.decision === 'approved') {
      const annex13 = await client.query<{ id: string }>(
        `INSERT INTO research_annexes
           (submission_id, qualification_cycle_id, annex_number, status, data,
            created_by, completed_by, completed_at)
         VALUES ($1, $2, 13, 'completed', $3::jsonb, $4, $4, NOW())
         RETURNING id`,
        [
          qualification.submission_id,
          annexCycleId,
          JSON.stringify({
            revisionNumber,
            decision: 'approved',
            affiliation: qualification.affiliation,
            reviewedAt,
          }),
          qualifierId,
        ],
      );
      annexIds.push(annex13.rows[0].id);
    }

    return { result: input.decision, annexIds };
  });
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
