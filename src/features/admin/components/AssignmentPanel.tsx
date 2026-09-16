import { useEffect, useState } from 'react';
import { platformService } from '../../../shared/services/platformService';
import type { User, Assignment } from '../../../shared/types/platform.types';
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
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Asignaciones</h1>
          <p className="page__subtitle">Asigna estudiantes a profesores evaluadores</p>
        </div>
      </div>

      <div className="page__body">
        <div className="assignment-grid">
          {/* Evaluator selection */}
          <div className="selector-panel">
            <h3 className="selector-panel__title">Profesor evaluador</h3>
            <div className="selector-search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="selector-search__icon">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                className="selector-search__input"
                type="text"
                placeholder="Buscar profesor..."
                value={evalSearch}
                onChange={(e) => setEvalSearch(e.target.value)}
              />
            </div>
            <div className="selector-panel__list">
              {evaluators.length === 0 && (
                <p className="selector-empty">Sin resultados</p>
              )}
              {evaluators.map((ev) => (
                <button
                  key={ev.id}
                  className={cn('selector-item', selectedEvaluator?.id === ev.id && 'selector-item--selected')}
                  onClick={() => setSelectedEvaluator(selectedEvaluator?.id === ev.id ? null : ev)}
                >
                  <span className="selector-item__avatar">{ev.name.charAt(0)}</span>
                  <span className="selector-item__info">
                    <span className="selector-item__name">{ev.name}</span>
                    <span className="selector-item__email">{ev.email}</span>
                  </span>
                  {selectedEvaluator?.id === ev.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#2563eb" />
                      <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="assignment-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M14 7l5 5-5 5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Student selection */}
          <div className="selector-panel">
            <h3 className="selector-panel__title">Estudiante</h3>
            <div className="selector-search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="selector-search__icon">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                className="selector-search__input"
                type="text"
                placeholder="Buscar estudiante..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div className="selector-panel__list">
              {students.length === 0 && (
                <p className="selector-empty">Sin resultados</p>
              )}
              {students.map((st) => (
                <button
                  key={st.id}
                  className={cn('selector-item', selectedStudent?.id === st.id && 'selector-item--selected')}
                  onClick={() => setSelectedStudent(selectedStudent?.id === st.id ? null : st)}
                >
                  <span className="selector-item__avatar selector-item__avatar--student">{st.name.charAt(0)}</span>
                  <span className="selector-item__info">
                    <span className="selector-item__name">{st.name}</span>
                    <span className="selector-item__email">{st.email}</span>
                  </span>
                  {selectedStudent?.id === st.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#2563eb" />
                      <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="assignment-action">
          <button
            className="eval-btn eval-btn--primary"
            onClick={handleAssign}
            disabled={!selectedEvaluator || !selectedStudent || saving ||
              (selectedEvaluator && selectedStudent ? isAssigned(selectedEvaluator.id, selectedStudent.id) : false)}
          >
            {saving ? 'Guardando...' : 'Asignar'}
          </button>
          {selectedEvaluator && selectedStudent && isAssigned(selectedEvaluator.id, selectedStudent.id) && (
            <p className="assignment-action__note">Esta asignación ya existe</p>
          )}
        </div>

        {/* Current assignments list */}
        <div className="assignments-list">
          <h3 className="assignments-list__title">Asignaciones actuales</h3>
          {assignments.length === 0 ? (
            <p className="empty-state__title" style={{ fontSize: '13px' }}>No hay asignaciones</p>
          ) : (
            assignments.map((a) => {
              const ev = users.find((u) => u.id === a.evaluatorId);
              const st = users.find((u) => u.id === a.studentId);
              if (!ev || !st) return null;
              return (
                <div key={a.id} className="assignment-row">
                  <span className="assignment-row__evaluator">{ev.name}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="assignment-row__student">{st.name}</span>
                  <button className="assignment-row__remove" onClick={() => handleRemove(a.id)} title="Eliminar asignación">
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
