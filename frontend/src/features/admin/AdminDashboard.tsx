import { useEffect, useState } from 'react';
import { platformService } from '../../shared/services/platformService';
import type { Assignment, StudentSubmission, User } from '../../shared/types/platform.types';
import './admin.css';

interface MemberRow { member: User; researchers: Array<{ student: User; submission: StudentSubmission | null }> }

function stage(submission: StudentSubmission | null) {
  if (!submission) return 'Sin investigación enviada';
  if (submission.classificationStatus !== 'classified') return 'Estratificación';
  if (submission.qualificationStatus === 'approved') return 'Aprobada';
  return 'Evaluación ética';
}

export function AdminDashboard() {
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([platformService.getUsers(), platformService.getAssignments(), platformService.getAllSubmissions()])
      .then(([users, assignments, researches]: [User[], Assignment[], StudentSubmission[]]) => {
        setSubmissions(researches);
        setRows(users.filter((user) => user.role === 'evaluator').map((member) => {
          const ids = assignments.filter((item) => item.evaluatorId === member.id).map((item) => item.studentId);
          return { member, researchers: users.filter((user) => ids.includes(user.id)).map((student) => ({ student, submission: researches.find((item) => item.studentId === student.id) ?? null })) };
        }));
      }).finally(() => setLoading(false));
  }, []);

  const active = submissions.filter((item) => item.classificationStatus !== 'cancelled' && item.qualificationStatus !== 'approved');
  const evaluating = active.filter((item) => item.classificationStatus === 'classified').length;

  return <div className="page">
    <div className="page__header"><div><h1 className="page__title">Panel de control</h1><p className="page__subtitle">Actividad actual del comité y distribución de investigadores.</p></div></div>
    <div className="page__body">
      {loading ? <div className="page__loading"><div className="pdf-spinner" />Cargando panel...</div> : <>
        <section className="admin-metrics" aria-label="Resumen de investigaciones">
          <article><span>Investigaciones activas</span><strong>{active.length}</strong><small>En proceso institucional</small></article>
          <article><span>En estratificación</span><strong>{active.length - evaluating}</strong><small>Pendientes de definir riesgo</small></article>
          <article><span>En evaluación</span><strong>{evaluating}</strong><small>Checklist o dictamen activos</small></article>
          <article><span>Miembros CEISH activos</span><strong>{rows.length}</strong><small>Con investigadores asignados</small></article>
        </section>
        <section className="admin-section"><div className="section-heading"><div><p>MIEMBROS ACTIVOS</p><h2>Distribución del comité</h2></div><span>{rows.reduce((total, row) => total + row.researchers.length, 0)} investigadores asignados</span></div>
          <div className="member-grid">
            {rows.map(({ member, researchers }) => <details className="member-folder" key={member.id}>
              <summary><span className="member-folder__avatar">{member.name.charAt(0)}</span><span><strong>{member.name}</strong><small>{member.email}</small></span><b>{researchers.length}<i>asignados</i></b><em>⌄</em></summary>
              <div className="member-folder__inside">{researchers.length ? researchers.map(({ student, submission }) => <div key={student.id} className="member-researcher"><span><strong>{student.name}</strong><small>{submission?.title ?? 'Sin investigación enviada'}</small></span><span className={`stage-chip stage-chip--${submission?.classificationStatus === 'classified' ? 'evaluation' : 'stratification'}`}>{stage(submission)}</span></div>) : <p>Este miembro no tiene investigadores asignados.</p>}</div>
            </details>)}
          </div>
        </section>
      </>}
    </div>
  </div>;
}
