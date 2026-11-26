import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { platformService } from '../../../shared/services/platformService';
import type { User } from '../../../shared/types/platform.types';
import { workflowService, type AdminResearchItem } from '../../../services/workflowService';
import { ResearchRow } from './ResearchManagementPanel';
import { QuestionnaireReview } from './QuestionnaireReview';
import { btnClass, pageLayout, spinnerClass } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

export function ResearchDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [research, setResearch] = useState<AdminResearchItem | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [items, users] = await Promise.all([workflowService.getAdminResearch(), platformService.getUsers()]);
    setResearch(items.find((item) => item.submission_id === submissionId) ?? null);
    setMembers(users.filter((user) => user.role === 'evaluator'));
  }, [submissionId]);

  useEffect(() => {
    void Promise.all([workflowService.getAdminResearch(), platformService.getUsers()])
      .then(([items, users]) => {
        setResearch(items.find((item) => item.submission_id === submissionId) ?? null);
        setMembers(users.filter((user) => user.role === 'evaluator'));
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) {
    return (
      <div className={cn(pageLayout.root, 'animate-folder-enter')}>
        <div className={cn(pageLayout.body, 'pt-8')}>
          <div className={pageLayout.loading}>
            <div className={spinnerClass} />
            Cargando expediente...
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cn(pageLayout.root, 'animate-folder-enter')}>
        <div className={cn(pageLayout.body, 'pt-8')}>
          <div className={pageLayout.alertError}>{error}</div>
        </div>
      </div>
    );
  }
  if (!research) {
    return (
      <div className={cn(pageLayout.root, 'animate-folder-enter')}>
        <div className={cn(pageLayout.body, 'pt-8')}>
          <div className={pageLayout.emptyState}>
            <h2 className={pageLayout.emptyTitle}>Expediente no encontrado</h2>
            <Link className={btnClass('outline', 'no-underline')} to="/admin/investigaciones">
              Volver a investigaciones
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const evalDone = research.classification_status === 'classified';
  const finalDone = research.qualification_status === 'approved';

  return (
    <div className={cn(pageLayout.root, 'animate-folder-enter')}>
      <div className="flex flex-col items-start gap-4 px-4 pt-5 pb-4 sm:px-6 sm:pt-7 sm:pb-5 lg:px-[42px] lg:pt-[34px] lg:pb-6 shrink-0">
        <Link className="self-start text-slate-600 text-[12px] font-medium no-underline hover:text-[#d92f2c] transition-colors" to="/admin/investigaciones">
          ← Volver a investigaciones
        </Link>
        <div>
          <p className="mb-1.5 text-[#ef3e3a] text-[10px] font-extrabold tracking-[0.12em]">
            EXPEDIENTE DE INVESTIGACIÓN
          </p>
          <h1 className={pageLayout.title}>{research.document_name}</h1>
          <p className={pageLayout.subtitle}>{research.researcher_name} · {research.researcher_email}</p>
        </div>
      </div>

      <div className={pageLayout.body}>
        <div className="px-5 py-4 border border-slate-200 rounded-[10px] bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="flex min-w-[120px] flex-col text-[#ef3e3a] text-[10px] font-bold">
              01
              <strong className="mt-1 text-slate-900 text-[12px]">Estratificación</strong>
            </span>
            <i className="w-px h-4 sm:w-auto sm:h-px sm:flex-1 ml-1.5 sm:ml-0 bg-slate-200" />
            <span className={cn('flex min-w-[120px] flex-col text-[10px] font-bold', evalDone ? 'text-[#ef3e3a]' : 'text-[#ef3e3a]')}>
              02
              <strong className="mt-1 text-slate-900 text-[12px]">Evaluación ética</strong>
            </span>
            <i className="w-px h-4 sm:w-auto sm:h-px sm:flex-1 ml-1.5 sm:ml-0 bg-slate-200" />
            <span className={cn('flex min-w-[120px] flex-col text-[10px] font-bold', finalDone ? 'text-[#ef3e3a]' : 'text-slate-400')}>
              03
              <strong className={cn('mt-1 text-[12px]', finalDone ? 'text-slate-900' : 'text-slate-500')}>
                Dictamen final
              </strong>
            </span>
          </div>
        </div>

        <ResearchRow research={research} members={members} onChanged={reload} />
        <QuestionnaireReview answers={research.questionnaire} />
      </div>
    </div>
  );
}
