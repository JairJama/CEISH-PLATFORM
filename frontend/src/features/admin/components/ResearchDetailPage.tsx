import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { platformService } from '../../../shared/services/platformService';
import type { User } from '../../../shared/types/platform.types';
import { workflowService, type AdminResearchItem } from '../../../services/workflowService';
import { ResearchRow } from './ResearchManagementPanel';
import '../admin.css';

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

  if (loading) return <div className="page page-transition"><div className="page__loading"><div className="pdf-spinner" />Cargando expediente...</div></div>;
  if (error) return <div className="page page-transition"><div className="page__body"><div className="workflow-alert workflow-alert--error">{error}</div></div></div>;
  if (!research) return <div className="page page-transition"><div className="page__body"><div className="empty-state"><h2 className="empty-state__title">Expediente no encontrado</h2><Link className="eval-btn eval-btn--outline" to="/admin/investigaciones">Volver a investigaciones</Link></div></div></div>;

  return <div className="page page-transition">
    <div className="page__header research-detail-header"><Link className="research-detail-back" to="/admin/investigaciones">← Volver a investigaciones</Link><div><p className="research-detail-kicker">EXPEDIENTE DE INVESTIGACIÓN</p><h1 className="page__title">{research.document_name}</h1><p className="page__subtitle">{research.researcher_name} · {research.researcher_email}</p></div></div>
    <div className="page__body"><div className="research-detail-process"><div className="research-detail-process__track"><span className="is-done">01<strong>Estratificación</strong></span><i /><span className={research.classification_status === 'classified' ? 'is-done' : 'is-current'}>02<strong>Evaluación ética</strong></span><i /><span className={research.qualification_status === 'approved' ? 'is-done' : ''}>03<strong>Dictamen final</strong></span></div></div><ResearchRow research={research} members={members} onChanged={reload} /></div>
  </div>;
}
