import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { platformService } from '../../shared/services/platformService';
import type { User, StudentSubmission } from '../../shared/types/platform.types';
import { StudentCard } from './components/StudentCard';
import { pageLayout, spinnerClass } from '../../shared/components/common/ui';
import { cn } from '../../utils/cn';

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
  allSubmissions: StudentSubmission[];
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
        allSubmissions: allSubs.filter((sub) => sub.studentId === s.id),
        submission: allSubs
          .filter((sub) => sub.studentId === s.id)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0] ?? null,
      }));
      setRows(result);
      setLoading(false);
    };
    load();
  }, [currentUser.id]);

  const filtered = rows.filter((r) => {
    const phase = !r.submission
      ? 'stratification'
      : r.submission.classificationStatus === 'classified'
        ? (r.submission.qualificationStatus === 'approved' ? 'completed' : 'evaluation')
        : 'stratification';
    return (filter === 'all' || phase === filter) && `${r.student.name} ${r.student.email}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Investigadores</h1>
          <p className={pageLayout.subtitle}>{rows.length} investigadores asignados y su etapa actual.</p>
        </div>
      </div>

      <div className={pageLayout.body}>
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-200">
          <input
            className="w-full sm:w-auto sm:max-w-[260px] mr-auto px-3 py-2 border border-slate-300 rounded-[7px] bg-white text-slate-900 text-[13px] outline-none transition focus:border-[#ef3e3a] focus:ring-2 focus:ring-[#ef3e3a]/15 placeholder:text-slate-400"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar investigador..."
          />
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              className={cn(
                'px-3 py-2 text-[12px] font-medium border-b-2 transition-colors cursor-pointer bg-transparent',
                filter === f
                  ? 'text-slate-900 font-semibold border-[#ef3e3a]'
                  : 'text-slate-500 border-transparent hover:text-slate-800',
              )}
              onClick={() => setFilter(f)}
              type="button"
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={pageLayout.loading}>
            <div className={spinnerClass} />
            <span>Cargando...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={pageLayout.emptyState}>
            <p className={pageLayout.emptyTitle}>No hay estudiantes en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {filtered.map((r) => (
              <StudentCard key={r.student.id} student={r.student} submission={r.submission} allSubmissions={r.allSubmissions} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
