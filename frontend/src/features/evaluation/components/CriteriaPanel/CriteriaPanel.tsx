import type {
  EvaluationMatrix,
  EvaluationStats,
  CriterionStatus,
  Criterion,
} from '../../types/evaluation.types';
import { CriterionItem } from './CriterionItem';

interface Props {
  matrix: EvaluationMatrix;
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
  matrix,
  stats,
  activeCriterionId,
  currentPdfPage,
  onActivateCriterion,
  onStatusChange,
  onObservationChange,
  onPageRefChange,
}: Props) {
  const { criteria } = matrix;
  const groups = groupByCategory(criteria);

  return (
    <aside className="w-full lg:w-[380px] lg:min-w-[340px] lg:max-w-[460px] border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col overflow-hidden bg-white shrink-0">
      <div className="px-4 pt-3.5 pb-3 border-b border-slate-200 shrink-0">
        <h2 className="text-[13px] font-semibold text-slate-900 leading-snug">{matrix.name}</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Versión {matrix.version}</p>
      </div>

      <div className="flex gap-2 px-4 py-3 border-b border-slate-200 shrink-0">
        <div className="flex-1 flex flex-col items-center py-2 px-1 rounded-lg border border-emerald-200 bg-emerald-50 gap-0.5">
          <span className="text-[22px] font-bold leading-none tabular-nums text-emerald-700">{stats.approved}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Aprobados</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-2 px-1 rounded-lg border border-red-200 bg-red-50 gap-0.5">
          <span className="text-[22px] font-bold leading-none tabular-nums text-[#d92f2c]">{stats.rejected}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#d92f2c]">Rechazados</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-2 px-1 rounded-lg border border-slate-200 bg-slate-50 gap-0.5">
          <span className="text-[22px] font-bold leading-none tabular-nums text-slate-500">{stats.pending}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Pendientes</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-200 shrink-0">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-[3px] overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-350"
            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
          />
          <div
            className="h-full bg-[#ef3e3a] ml-px transition-[width] duration-350"
            style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
          {stats.completionRate}% completado
        </span>
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
        {groups.map(([category, items]) => (
          <div key={category} className="mb-0.5">
            <h3 className="sticky top-0 z-2 px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 bg-slate-50 border-b border-slate-200">
              {category}
            </h3>
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
