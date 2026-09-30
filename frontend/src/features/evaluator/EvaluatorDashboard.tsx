import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { platformService } from '../../shared/services/platformService';
import type { User, StudentSubmission } from '../../shared/types/platform.types';
import { StudentCard } from './components/StudentCard';
import './evaluator.css';

type Filter = 'all' | 'stratification' | 'evaluation' | 'completed';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Todos',
  stratification: 'Estratificación',
  evaluation: 'Evaluación',
  completed: 'Finalizadas',
};

interface StudentRow {
  student: User;
  submission: StudentSubmission | null;
}

export function EvaluatorDashboard() {
  const currentUser = useAuthStore((s) => s.currentUser)!;
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [users, assignments, allSubs] = await Promise.all([
        platformService.getUsers(),
        platformService.getAssignmentsForEvaluator(currentUser.id),
        platformService.getAllSubmissions(),
      ]);
      const studentIds = assignments.map((a) => a.studentId);
      const students = users.filter((u) => studentIds.includes(u.id));
      const result: StudentRow[] = students.map((s) => ({
        student: s,
        submission: allSubs.find((sub) => sub.studentId === s.id) ?? null,
      }));
      setRows(result);
      setLoading(false);
    };
    load();
  }, [currentUser.id]);

  const filtered = rows.filter((r) => {
    const phase = !r.submission ? 'stratification' : r.submission.classificationStatus === 'classified'
      ? (r.submission.qualificationStatus === 'approved' ? 'completed' : 'evaluation') : 'stratification';
    return (filter === 'all' || phase === filter) && `${r.student.name} ${r.student.email}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Investigadores</h1>
          <p className="page__subtitle">{rows.length} investigadores asignados y su etapa actual.</p>
        </div>
      </div>

      <div className="page__body">
        <div className="filter-bar">
          <input className="filter-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar investigador..." />
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              className={`filter-pill ${filter === f ? 'filter-pill--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="page__loading"><div className="pdf-spinner" /><span>Cargando...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No hay estudiantes en esta categoría</p>
          </div>
        ) : (
          <div className="student-list">
            {filtered.map((r) => (
              <StudentCard key={r.student.id} student={r.student} submission={r.submission} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
