// Consultas SQL del dominio de revisiones (lado servidor).
// Una revisión se devuelve con sus etapas, criterios y anotaciones anidados.
import { query, withTransaction } from '../../lib/database';

export interface AnnotationRow {
  id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  comment: string;
}

export interface CriterionRow {
  id: string;
  criterion: string;
  status: string;
  comment: string;
  annotations: AnnotationRow[];
}

export interface StageRow {
  id: string;
  stage_number: number;
  status: string;
  completed_at: string | null;
  criteria: CriterionRow[];
}

export interface ReviewRow {
  id: string;
  submission_id: string;
  student_id: string;
  reviewer_id: string;
  reviewer_name: string;
  comment: string;
  grade: number | null;
  status: string;
  created_at: string;
  stages: StageRow[];
}

interface FlatReview {
  id: string;
  submission_id: string;
  student_id: string;
  reviewer_id: string;
  reviewer_name: string;
  comment: string;
  grade: number | null;
  status: string;
  created_at: string;
}

// ── Plantilla de etapas y criterios (4 etapas fijas) ────────────────────────
const STAGE_TEMPLATE: { name: string; criteria: string[] }[] = [
  {
    name: 'Estructura',
    criteria: [
      'El documento contiene una introducción clara',
      'Los objetivos están claramente definidos',
      'La hipótesis o pregunta de investigación está planteada',
    ],
  },
  {
    name: 'Metodología',
    criteria: [
      'La metodología es apropiada para el tipo de investigación',
      'La población de estudio está correctamente definida',
      'Los instrumentos de recolección están descritos',
    ],
  },
  {
    name: 'Resultados',
    criteria: [
      'Los resultados se presentan de forma clara y ordenada',
      'El análisis estadístico es correcto y justificado',
      'Las conclusiones responden a los objetivos planteados',
    ],
  },
  {
    name: 'Formato',
    criteria: [
      'Las referencias bibliográficas están en formato APA',
      'El documento cumple con los criterios de extensión mínima',
    ],
  },
];

/** Devuelve la revisión de una entrega con todo el árbol anidado, o null. */
export async function getReviewBySubmission(submissionId: string): Promise<ReviewRow | null> {
  const reviews = await query<FlatReview>(
    `SELECT rv.id, rv.submission_id, s.student_id, rv.reviewer_id, u.name AS reviewer_name,
            rv.comment, rv.grade, rv.status, rv.created_at
       FROM reviews rv
       JOIN users u ON u.id = rv.reviewer_id
       JOIN submissions s ON s.id = rv.submission_id
      WHERE rv.submission_id = $1`,
    [submissionId],
  );
  const review = reviews[0];
  if (!review) return null;

  const stages = await query<Omit<StageRow, 'criteria'>>(
    `SELECT id, stage_number, status, completed_at
       FROM review_stages
      WHERE review_id = $1
      ORDER BY stage_number`,
    [review.id],
  );

  const stageIds = stages.map((s) => s.id);
  const criteria = stageIds.length
    ? await query<CriterionRow & { stage_id: string }>(
        `SELECT id, stage_id, criterion, status, comment
           FROM criteria_evaluations
          WHERE stage_id = ANY($1)
          ORDER BY id`,
        [stageIds],
      )
    : [];

  const criterionIds = criteria.map((c) => c.id);
  const annotations = criterionIds.length
    ? await query<AnnotationRow & { criteria_evaluation_id: string }>(
        `SELECT id, criteria_evaluation_id, page_number, x, y, width, height, comment
           FROM annotations
          WHERE criteria_evaluation_id = ANY($1)`,
        [criterionIds],
      )
    : [];

  // Ensamblar el árbol (construyendo objetos explícitos, sin bindings descartados)
  return {
    ...review,
    stages: stages.map((stage) => ({
      ...stage,
      criteria: criteria
        .filter((c) => c.stage_id === stage.id)
        .map((c): CriterionRow => ({
          id: c.id,
          criterion: c.criterion,
          status: c.status,
          comment: c.comment,
          annotations: annotations
            .filter((a) => a.criteria_evaluation_id === c.id)
            .map((a): AnnotationRow => ({
              id: a.id,
              page_number: a.page_number,
              x: a.x,
              y: a.y,
              width: a.width,
              height: a.height,
              comment: a.comment,
            })),
        })),
    })),
  };
}

/**
 * Devuelve la revisión existente de una entrega o crea una nueva con sus 4 etapas.
 *
 * Es seguro ante llamadas concurrentes (p. ej. el doble montaje de efectos de
 * React en desarrollo): un advisory lock por submission serializa la creación,
 * de modo que la segunda llamada encuentra la revisión ya creada en lugar de
 * violar la restricción única.
 */
export async function getOrCreateReview(
  submissionId: string,
  evaluatorId: string,
): Promise<ReviewRow> {
  await withTransaction(async (client) => {
    // Serializa por submission: la 2ª llamada espera aquí hasta que la 1ª haga COMMIT.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [submissionId]);

    const existing = await client.query('SELECT id FROM reviews WHERE submission_id = $1', [submissionId]);
    if (existing.rows.length > 0) return;

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO reviews (submission_id, reviewer_id, status)
       VALUES ($1, $2, 'in-progress')
       RETURNING id`,
      [submissionId, evaluatorId],
    );
    const reviewId = inserted.rows[0].id;

    for (let i = 0; i < STAGE_TEMPLATE.length; i++) {
      const stageNumber = i + 1;
      const stageStatus = i === 0 ? 'in-progress' : 'pending';
      const stage = await client.query<{ id: string }>(
        `INSERT INTO review_stages (review_id, stage_number, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [reviewId, stageNumber, stageStatus],
      );
      const stageId = stage.rows[0].id;
      for (const criterion of STAGE_TEMPLATE[i].criteria) {
        await client.query(
          `INSERT INTO criteria_evaluations (stage_id, criterion, status)
           VALUES ($1, $2, 'pending')`,
          [stageId, criterion],
        );
      }
    }

    // Al abrir la revisión, la entrega pasa a "en revisión" (submitted)
    await client.query(
      `UPDATE submissions SET status = 'submitted' WHERE id = $1 AND status = 'pending'`,
      [submissionId],
    );
  });

  return (await getReviewBySubmission(submissionId))!;
}

// ── Persistencia de una revisión completa ───────────────────────────────────
export interface SaveCriterionInput {
  id: string;
  status: string;
  comment: string;
  pageReference: number | null;
}
export interface SaveStageInput {
  stageNumber: number;
  status: string;
  completedAt: string | null;
  criteria: SaveCriterionInput[];
}
export interface SaveReviewInput {
  reviewId: string;
  submissionId: string;
  status: string;
  comment: string;
  grade: number | null;
  stages: SaveStageInput[];
}

export async function saveReview(input: SaveReviewInput): Promise<void> {
  for (const stage of input.stages) {
    if (stage.status === 'completed' && stage.criteria.some((criterion) => criterion.status === 'pending')) {
      throw new Error(`No se puede completar la etapa ${stage.stageNumber} mientras existan criterios pendientes`);
    }
  }
  if (input.status === 'completed') {
    const allStagesCompleted = input.stages.length === STAGE_TEMPLATE.length
      && input.stages.every((stage) => stage.status === 'completed');
    const allCriteriaResolved = input.stages.every((stage) => stage.criteria.every((criterion) => criterion.status !== 'pending'));
    const validGrade = typeof input.grade === 'number' && Number.isFinite(input.grade) && input.grade >= 0 && input.grade <= 10;
    if (!allStagesCompleted || !allCriteriaResolved || !validGrade || !input.comment.trim()) {
      throw new Error('Completa todas las etapas y criterios, e ingresa calificación y comentario final antes de finalizar');
    }
  }

  await query(
    `UPDATE reviews SET comment = $2, grade = $3, status = $4 WHERE id = $1`,
    [input.reviewId, input.comment, input.grade, input.status],
  );

  for (const stage of input.stages) {
    await query(
      `UPDATE review_stages SET status = $3, completed_at = $4
        WHERE review_id = $1 AND stage_number = $2`,
      [input.reviewId, stage.stageNumber, stage.status, stage.completedAt],
    );
    for (const c of stage.criteria) {
      await query(
        `UPDATE criteria_evaluations SET status = $2, comment = $3 WHERE id = $1`,
        [c.id, c.status, c.comment],
      );
      // La referencia de página se guarda como una anotación simple (sin coordenadas)
      await query(`DELETE FROM annotations WHERE criteria_evaluation_id = $1`, [c.id]);
      if (c.pageReference != null) {
        await query(
          `INSERT INTO annotations (criteria_evaluation_id, page_number, x, y, width, height, comment)
           VALUES ($1, $2, 0, 0, 0, 0, '')`,
          [c.id, c.pageReference],
        );
      }
    }
  }

  // Al completar la revisión, sincronizar la entrega
  if (input.status === 'completed') {
    await query(
      `UPDATE submissions
          SET status = 'reviewed', reviewed_at = NOW(), grade = $2, final_comment = $3
        WHERE id = $1`,
      [input.submissionId, input.grade, input.comment],
    );
  }
}
