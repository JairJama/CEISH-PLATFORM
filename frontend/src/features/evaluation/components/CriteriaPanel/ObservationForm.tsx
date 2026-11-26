import type { Criterion } from '../../types/evaluation.types';

interface Props {
  criterion: Criterion;
  currentPdfPage: number;
  onObservationChange: (id: string, observation: string) => void;
  onPageRefChange: (id: string, page: number | undefined) => void;
}

export function ObservationForm({
  criterion,
  currentPdfPage,
  onObservationChange,
  onPageRefChange,
}: Props) {
  const handleObsChange = (val: string) => {
    onObservationChange(criterion.id, val);
  };

  const handlePageRefChange = (val: string) => {
    const num = parseInt(val);
    onPageRefChange(criterion.id, isNaN(num) ? undefined : num);
  };

  const useCurrentPage = () => {
    onPageRefChange(criterion.id, currentPdfPage);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em]">Observación</label>
        <textarea
          className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-[12px] text-slate-900 bg-white resize-y leading-relaxed outline-none transition focus:border-[#ef3e3a] focus:ring-3 focus:ring-[#ef3e3a]/15 placeholder:text-slate-400"
          placeholder="Describe el problema o hallazgo encontrado..."
          value={criterion.observation}
          onChange={(e) => handleObsChange(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em]">Referencia de página</label>
        <div className="flex gap-1.5 items-center">
          <input
            type="number"
            className="w-[68px] h-7 px-2 border border-slate-300 rounded-md text-[12px] text-slate-900 bg-white text-center outline-none transition focus:border-[#ef3e3a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Pág."
            value={criterion.pageReference?.toString() ?? ''}
            onChange={(e) => handlePageRefChange(e.target.value)}
            min={1}
          />
          <button
            className="text-[11px] font-medium text-[#d92f2c] bg-red-50 border border-red-200 rounded-md py-1 px-2.5 cursor-pointer transition-colors hover:bg-red-100"
            onClick={useCurrentPage}
            type="button"
          >
            Usar página actual ({currentPdfPage})
          </button>
        </div>
      </div>
    </div>
  );
}
