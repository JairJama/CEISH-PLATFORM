import { useEffect, useState, type FormEvent } from 'react';
import {
  workflowService, type RiskLevel, type StratificationTask,
} from '../../services/workflowService';
import './evaluator.css';

const RISK_LABELS: Record<RiskLevel, string> = {
  'no-risk': 'Sin riesgo',
  'minimal-risk': 'Riesgo mínimo',
  'greater-than-minimal': 'Riesgo mayor al mínimo',
};

function StratificationCard({ task, onSaved }: { task: StratificationTask; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const closed = task.classification_status === 'classified';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const riskLevel = new FormData(event.currentTarget).get('riskLevel') as RiskLevel | null;
    if (!riskLevel) {
      setMessage('Selecciona un nivel de riesgo.');
      return;
    }
    setSaving(true);
    try {
      const result = await workflowService.saveRiskDecision(task.id, riskLevel);
      setMessage(result.message);
      await onSaved();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="stratification-card">
      <div className="stratification-card__header">
        <div>
          <span className="stratification-card__round">Estratificador {task.round_number}</span>
          <h2>{task.document_name}</h2>
          <p>{task.researcher_name} · {task.researcher_email}</p>
        </div>
        <span className={`badge ${closed ? 'badge--success' : 'badge--warning'}`}>
          {closed ? 'Clasificada' : task.decided_at ? 'Esperando consenso' : 'Pendiente'}
        </span>
      </div>

      {task.other_risk_level && (
        <div className="stratification-card__previous">
          El otro estratificador determinó: <strong>{RISK_LABELS[task.other_risk_level]}</strong>
        </div>
      )}

      {closed && task.final_risk_level ? (
        <div className="stratification-card__result">
          Nivel acordado: <strong>{RISK_LABELS[task.final_risk_level]}</strong>
        </div>
      ) : (
        <form className="stratification-card__form" onSubmit={submit}>
          <fieldset disabled={saving}>
            <legend>Selecciona el nivel de riesgo</legend>
            {(Object.entries(RISK_LABELS) as [RiskLevel, string][]).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name="riskLevel" value={value} defaultChecked={task.risk_level === value} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <button className="eval-btn eval-btn--primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : task.decided_at ? 'Actualizar dictamen' : 'Guardar dictamen'}
          </button>
        </form>
      )}

      {message && <p className="stratification-card__message" role="status">{message}</p>}
      <button
        className="eval-btn eval-btn--outline stratification-card__document"
        onClick={() => window.open(`/api/documents/${task.submission_id}/raw`, '_blank', 'noopener')}
      >
        Ver documento
      </button>
    </article>
  );
}

export function StratificationDashboard() {
  const [tasks, setTasks] = useState<StratificationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const data = await workflowService.getStratificationTasks();
    setTasks(data);
  };

  useEffect(() => {
    void workflowService.getStratificationTasks()
      .then(setTasks)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  const pending = tasks.filter((task) => task.classification_status !== 'classified').length;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Estratificación de riesgo</h1>
          <p className="page__subtitle">{pending} investigaciones pendientes de dictamen</p>
        </div>
      </div>
      <div className="page__body">
        {error && <div className="workflow-alert workflow-alert--error" role="alert">{error}</div>}
        {loading ? (
          <div className="page__loading"><div className="pdf-spinner" /><span>Cargando...</span></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No tienes investigaciones asignadas</p>
            <p className="empty-state__desc">Las nuevas entregas se asignarán automáticamente.</p>
          </div>
        ) : (
          <div className="stratification-list">
            {tasks.map((task) => <StratificationCard key={task.id} task={task} onSaved={reload} />)}
          </div>
        )}
      </div>
    </div>
  );
}
