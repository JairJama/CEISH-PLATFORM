import { useEffect, useState } from 'react';
import { platformService } from '../../shared/services/platformService';
import type { Assignment, StudentSubmission, User } from '../../shared/types/platform.types';
import { pageLayout, spinnerClass } from '../../shared/components/common/ui';
import { cn } from '../../utils/cn';

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

  return (
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Panel de control</h1>
          <p className={pageLayout.subtitle}>Actividad actual del comité y distribución de investigadores.</p>
        </div>
      </div>
      <div className={pageLayout.body}>
        {loading ? (
          <div className={pageLayout.loading}>
            <div className={spinnerClass} />
            Cargando panel...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" aria-label="Resumen de investigaciones">
              <article className="p-[18px] border border-slate-200 rounded-[10px] bg-white shadow-xs">
                <span className="block text-slate-500 text-[11px]">Investigaciones activas</span>
                <strong className="block my-1.5 text-slate-900 text-[29px] font-bold">{active.length}</strong>
                <small className="block text-slate-400 text-[11px]">En proceso institucional</small>
              </article>
              <article className="p-[18px] border border-slate-200 rounded-[10px] bg-white shadow-xs">
                <span className="block text-slate-500 text-[11px]">En estratificación</span>
                <strong className="block my-1.5 text-slate-900 text-[29px] font-bold">{active.length - evaluating}</strong>
                <small className="block text-slate-400 text-[11px]">Pendientes de definir riesgo</small>
              </article>
              <article className="p-[18px] border border-slate-200 rounded-[10px] bg-white shadow-xs">
                <span className="block text-slate-500 text-[11px]">En evaluación</span>
                <strong className="block my-1.5 text-slate-900 text-[29px] font-bold">{evaluating}</strong>
                <small className="block text-slate-400 text-[11px]">Checklist o dictamen activos</small>
              </article>
              <article className="p-[18px] border border-slate-200 rounded-[10px] bg-white shadow-xs">
                <span className="block text-slate-500 text-[11px]">Miembros CEISH activos</span>
                <strong className="block my-1.5 text-slate-900 text-[29px] font-bold">{rows.length}</strong>
                <small className="block text-slate-400 text-[11px]">Con investigadores asignados</small>
              </article>
            </section>

            <section className="mt-4">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-[#ef3e3a] text-[10px] font-extrabold tracking-[0.1em]">MIEMBROS ACTIVOS</p>
                  <h2 className="text-slate-900 text-[17px] font-semibold">Distribución del comité</h2>
                </div>
                <span className="text-slate-500 text-[11px]">
                  {rows.reduce((total, row) => total + row.researchers.length, 0)} investigadores asignados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-3.5">
                {rows.map(({ member, researchers }) => (
                  <details className="group border border-slate-200 rounded-[10px] bg-white overflow-hidden shadow-xs" key={member.id}>
                    <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50/70 transition-colors">
                      <span className="grid w-9 h-9 place-items-center rounded-full bg-red-100 text-[#d92f2c] font-extrabold shrink-0">
                        {member.name.charAt(0)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <strong className="block text-slate-900 text-[13px] truncate">{member.name}</strong>
                        <small className="block text-slate-500 text-[11px] truncate">{member.email}</small>
                      </span>
                      <b className="text-slate-900 text-[18px] text-center leading-tight">
                        {researchers.length}
                        <i className="block text-slate-500 text-[9px] not-italic font-medium">asignados</i>
                      </b>
                      <em className="text-slate-400 not-italic transition-transform group-open:rotate-180">⌄</em>
                    </summary>

                    <div className="px-4 pb-3 border-t border-slate-200">
                      {researchers.length ? (
                        researchers.map(({ student, submission }) => (
                          <div key={student.id} className="flex items-center justify-between gap-2.5 py-2.5 border-b border-slate-100 last:border-b-0">
                            <span className="min-w-0">
                              <strong className="block text-slate-900 text-[13px] truncate">{student.name}</strong>
                              <small className="block text-slate-500 text-[11px] truncate">{submission?.title ?? 'Sin investigación enviada'}</small>
                            </span>
                            <span
                              className={cn(
                                'px-2 py-1 rounded-[5px] text-[10px] font-semibold whitespace-nowrap border',
                                submission?.classificationStatus === 'classified'
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                  : 'bg-amber-50 border-amber-200 text-amber-800',
                              )}
                            >
                              {stage(submission)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="py-3 text-[12px] text-slate-500">Este miembro no tiene investigadores asignados.</p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
