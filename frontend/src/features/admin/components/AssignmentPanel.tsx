import { useEffect, useState } from 'react';
import { platformService } from '../../../shared/services/platformService';
import type { User, Assignment } from '../../../shared/types/platform.types';
import { btnClass, pageLayout } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

export function AssignmentPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedEvaluator, setSelectedEvaluator] = useState<User | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [evalSearch, setEvalSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const allEvaluators = users.filter((u) => u.role === 'evaluator');
  const allStudents = users.filter((u) => u.role === 'student');

  const evaluators = allEvaluators.filter((u) =>
    u.name.toLowerCase().includes(evalSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(evalSearch.toLowerCase())
  );
  const students = allStudents.filter((u) =>
    u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const load = async () => {
    const all = await platformService.getAssignments();
    setAssignments(all);
  };

  useEffect(() => {
    void Promise.all([
      platformService.getUsers(),
      platformService.getAssignments(),
    ]).then(([allUsers, allAssignments]) => {
      setUsers(allUsers);
      setAssignments(allAssignments);
    });
  }, []);

  const isAssigned = (evaluatorId: string, studentId: string) =>
    assignments.some((a) => a.evaluatorId === evaluatorId && a.studentId === studentId);

  const handleAssign = async () => {
    if (!selectedEvaluator || !selectedStudent) return;
    if (isAssigned(selectedEvaluator.id, selectedStudent.id)) return;
    setSaving(true);
    await platformService.createAssignment(selectedEvaluator.id, selectedStudent.id);
    await load();
    setSelectedEvaluator(null);
    setSelectedStudent(null);
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    await platformService.deleteAssignment(id);
    await load();
  };

  return (
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Asignaciones</h1>
          <p className={pageLayout.subtitle}>Asigna estudiantes a profesores evaluadores</p>
        </div>
      </div>

      <div className={pageLayout.body}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-2">
              Profesor evaluador
            </h3>
            <div className="relative mb-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                className="w-full py-2 pr-2.5 pl-8 text-[12px] border border-slate-300 rounded-md bg-white text-slate-900 outline-none transition focus:border-[#ef3e3a] placeholder:text-slate-400"
                type="text"
                placeholder="Buscar profesor..."
                value={evalSearch}
                onChange={(e) => setEvalSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {evaluators.length === 0 && (
                <p className="text-[12px] text-slate-400 px-1 py-1.5">Sin resultados</p>
              )}
              {evaluators.map((ev) => (
                <button
                  key={ev.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-left w-full',
                    selectedEvaluator?.id === ev.id
                      ? 'border-[#ef3e3a] bg-red-50/70'
                      : 'border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/40',
                  )}
                  onClick={() => setSelectedEvaluator(selectedEvaluator?.id === ev.id ? null : ev)}
                  type="button"
                >
                  <span className="w-7 h-7 rounded-full bg-red-100 text-[#d92f2c] flex items-center justify-center text-[12px] font-bold shrink-0">
                    {ev.name.charAt(0)}
                  </span>
                  <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13px] text-slate-900 font-medium truncate">{ev.name}</span>
                    <span className="text-[11px] text-slate-500 truncate">{ev.email}</span>
                  </span>
                  {selectedEvaluator?.id === ev.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#ef3e3a" />
                      <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center md:pt-11 rotate-90 md:rotate-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M14 7l5 5-5 5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-2">
              Estudiante
            </h3>
            <div className="relative mb-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                className="w-full py-2 pr-2.5 pl-8 text-[12px] border border-slate-300 rounded-md bg-white text-slate-900 outline-none transition focus:border-[#ef3e3a] placeholder:text-slate-400"
                type="text"
                placeholder="Buscar estudiante..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {students.length === 0 && (
                <p className="text-[12px] text-slate-400 px-1 py-1.5">Sin resultados</p>
              )}
              {students.map((st) => (
                <button
                  key={st.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-left w-full',
                    selectedStudent?.id === st.id
                      ? 'border-[#ef3e3a] bg-red-50/70'
                      : 'border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/40',
                  )}
                  onClick={() => setSelectedStudent(selectedStudent?.id === st.id ? null : st)}
                  type="button"
                >
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[12px] font-bold shrink-0">
                    {st.name.charAt(0)}
                  </span>
                  <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13px] text-slate-900 font-medium truncate">{st.name}</span>
                    <span className="text-[11px] text-slate-500 truncate">{st.email}</span>
                  </span>
                  {selectedStudent?.id === st.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#ef3e3a" />
                      <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <button
            className={btnClass('primary')}
            onClick={handleAssign}
            disabled={!selectedEvaluator || !selectedStudent || saving ||
              (selectedEvaluator && selectedStudent ? isAssigned(selectedEvaluator.id, selectedStudent.id) : false)}
            type="button"
          >
            {saving ? 'Guardando...' : 'Asignar'}
          </button>
          {selectedEvaluator && selectedStudent && isAssigned(selectedEvaluator.id, selectedStudent.id) && (
            <p className="text-[12px] text-slate-500">Esta asignación ya existe</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col gap-2 shadow-xs">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-1">
            Asignaciones actuales
          </h3>
          {assignments.length === 0 ? (
            <p className="text-[13px] font-semibold text-slate-700">No hay asignaciones</p>
          ) : (
            assignments.map((a) => {
              const ev = users.find((u) => u.id === a.evaluatorId);
              const st = users.find((u) => u.id === a.studentId);
              if (!ev || !st) return null;
              return (
                <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-[13px]">
                  <span className="text-slate-900 font-medium">{ev.name}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="flex-1 text-slate-600">{st.name}</span>
                  <button
                    className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-red-50 hover:text-[#d92f2c] transition-colors"
                    onClick={() => handleRemove(a.id)}
                    title="Eliminar asignación"
                    type="button"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M3.5 3.5l6 6M9.5 3.5l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
