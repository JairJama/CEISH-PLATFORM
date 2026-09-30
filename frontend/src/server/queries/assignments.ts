// Consultas SQL del dominio de asignaciones (lado servidor).
import { query } from '../../lib/database';

export interface AssignmentRow {
  id: string;
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  created_at: string;
}

const BASE_SELECT = `
  SELECT a.id, a.teacher_id, t.name AS teacher_name,
         a.student_id, s.name AS student_name, a.created_at
    FROM assignments a
    JOIN users t ON t.id = a.teacher_id
    JOIN users s ON s.id = a.student_id`;

export async function listAssignments(): Promise<AssignmentRow[]> {
  return query<AssignmentRow>(`${BASE_SELECT} ORDER BY a.created_at`);
}

export async function listAssignmentsByTeacher(teacherId: string): Promise<AssignmentRow[]> {
  return query<AssignmentRow>(
    `${BASE_SELECT} WHERE a.teacher_id = $1 ORDER BY s.name`,
    [teacherId],
  );
}

export async function createAssignment(teacherId: string, studentId: string): Promise<AssignmentRow> {
  const rows = await query<{ id: string }>(
    `INSERT INTO assignments (teacher_id, student_id)
     VALUES ($1, $2)
     ON CONFLICT (teacher_id, student_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id
     RETURNING id`,
    [teacherId, studentId],
  );
  const result = await query<AssignmentRow>(`${BASE_SELECT} WHERE a.id = $1`, [rows[0].id]);
  return result[0];
}

export async function deleteAssignment(id: string): Promise<void> {
  await query(`DELETE FROM assignments WHERE id = $1`, [id]);
}
