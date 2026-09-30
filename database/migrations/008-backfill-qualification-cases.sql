-- Las clasificaciones sin riesgo previas a la creación automática del caso
-- de calificación conservan al estratificador como evaluador inicial.
INSERT INTO qualification_cases (submission_id, qualifier_id)
SELECT submission.id, assignment.stratifier_id
  FROM submissions submission
  JOIN stratification_assignments assignment
    ON assignment.submission_id = submission.id
   AND assignment.round_number = 1
 WHERE submission.classification_status = 'classified'
   AND submission.risk_level = 'no-risk'
ON CONFLICT (submission_id) DO NOTHING;

INSERT INTO qualification_cycles (qualification_id, cycle_number)
SELECT qualification.id, 1
  FROM qualification_cases qualification
ON CONFLICT (qualification_id, cycle_number) DO NOTHING;
