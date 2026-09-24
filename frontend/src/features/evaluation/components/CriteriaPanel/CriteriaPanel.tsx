import type {
  EvaluationSession,
  EvaluationStats,
  CriterionStatus,
  Criterion,
} from '../../types/evaluation.types';
import { CriterionItem } from './CriterionItem';

interface Props {
  session: EvaluationSession;
  stats: EvaluationStats;
  activeCriterionId: string | null;
  currentPdfPage: number;
  onActivateCriterion: (id: string | null) => void;
  onStatusChange: (id: string, status: CriterionStatus) => void;
  onObservationChange: (id: string, observation: string) => void;
  onPageRefChange: (id: string, page: number | undefined) => void;
}

function groupByCategory(criteria: Criterion[]): [string, Criterion[]][] {
  const map = new Map<string, Criterion[]>();
  for (const c of criteria) {
    const cat = c.category ?? 'General';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(c);
  }
  return [...map.entries()];
}

export function CriteriaPanel({
  session,
  stats,
  activeCriterionId,
  currentPdfPage,
  onActivateCriterion,
  onStatusChange,
  onObservationChange,
  onPageRefChange,
}: Props) {
  const { criteria } = session.matrix;
  const groups = groupByCategory(criteria);

  return (
    <aside className="criteria-panel">
      <div className="criteria-panel__header">
        <h2 className="criteria-panel__title">{session.matrix.name}</h2>
        <p className="criteria-panel__version">Versión {session.matrix.version}</p>
      </div>

      <div className="criteria-panel__stats">
        <div className="stat-pill stat-pill--approved">
          <span className="stat-pill__value">{stats.approved}</span>
          <span className="stat-pill__label">Aprobados</span>
        </div>
        <div className="stat-pill stat-pill--rejected">
          <span className="stat-pill__value">{stats.rejected}</span>
          <span className="stat-pill__label">Rechazados</span>
        </div>
        <div className="stat-pill stat-pill--pending">
          <span className="stat-pill__value">{stats.pending}</span>
          <span className="stat-pill__label">Pendientes</span>
        </div>
      </div>

      <div className="criteria-panel__progress">
        <div className="criteria-panel__progress-bar">
          <div
            className="criteria-panel__progress-fill criteria-panel__progress-fill--approved"
            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
          />
          <div
            className="criteria-panel__progress-fill criteria-panel__progress-fill--rejected"
            style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
          />
        </div>
        <span className="criteria-panel__completion">{stats.completionRate}% completado</span>
      </div>

      <div className="criteria-panel__list">
        {groups.map(([category, items]) => (
          <div key={category} className="criteria-group">
            <h3 className="criteria-group__title">{category}</h3>
            {items.map((criterion) => (
              <CriterionItem
                key={criterion.id}
                criterion={criterion}
                index={criteria.indexOf(criterion)}
                isActive={activeCriterionId === criterion.id}
                currentPdfPage={currentPdfPage}
                onActivate={() => onActivateCriterion(criterion.id)}
                onStatusChange={onStatusChange}
                onObservationChange={onObservationChange}
                onPageRefChange={onPageRefChange}
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
