import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformService } from '../../shared/services/platformService';
import type { User, StudentSubmission, Assignment } from '../../shared/types/platform.types';
import './admin.css';

interface EvaluatorRow {
  evaluator: User;
  students: { student: User; submission: StudentSubmission | null }[];
}

const STATUS_CONFIG = {
  none: { label: 'Sin entrega', cls: 'badge--neutral' },
  pending: { label: 'Pendiente', cls: 'badge--warning' },
  'under-review': { label: 'En revisión', cls: 'badge--info' },
  reviewed: { label: 'Revisado', cls: 'badge--success' },
} as const;

export function AdminDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<EvaluatorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const getRows = async (): Promise<EvaluatorRow[]> => {
    const [users, assignments, allSubs]: [User[], Assignment[], StudentSubmission[]] = await Promise.all([
      platformService.getUsers(),
      platformService.getAssignments(),
      platformService.getAllSubmissions(),
    ]);
    const evaluators = users.filter((u) => u.role === 'evaluator');
    const result: EvaluatorRow[] = evaluators.map((ev) => {
      const studentIds = assignments.filter((a) => a.evaluatorId === ev.id).map((a) => a.studentId);
      const students = users.filter((u) => studentIds.includes(u.id)).map((s) => ({
        student: s,
        submission: allSubs.find((sub) => sub.studentId === s.id) ?? null,
      }));
      return { evaluator: ev, students };
    });
    return result;
  };

  useEffect(() => {
    void getRows().then((result) => {
      setRows(result);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Panel general</h1>
          <p className="page__subtitle">Estado de evaluaciones por profesor</p>
        </div>
      </div>

      <div className="page__body">
        {loading ? (
          <div className="page__loading"><div className="pdf-spinner" /><span>Cargando...</span></div>
        ) : (
          <div className="admin-evaluators">
            {rows.map((row) => (
              <div key={row.evaluator.id} className="evaluator-block">
                <div className="evaluator-block__header">
                  <span className="evaluator-block__avatar">{row.evaluator.name.charAt(0)}</span>
                  <div>
                    <p className="evaluator-block__name">{row.evaluator.name}</p>
                    <p className="evaluator-block__count">{row.students.length} estudiantes asignados</p>
                  </div>
                </div>
                {row.students.length === 0 ? (
                  <p className="evaluator-block__empty">Sin estudiantes asignados</p>
                ) : (
                  <div className="evaluator-block__students">
                    {row.students.map(({ student, submission }) => {
                      const statusKey = submission ? submission.status : 'none';
                      const status = STATUS_CONFIG[statusKey];
                      return (
                        <div key={student.id} className="admin-student-row">
                          <span className="admin-student-row__name">{student.name}</span>
                          <span className={`badge ${status.cls}`}>{status.label}</span>
                          {submission && (
                            <button
                              className="eval-btn eval-btn--sm eval-btn--outline"
                              onClick={() => navigate(`/evaluador/revision/${submission.id}`)}
                            >
                              Abrir
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
