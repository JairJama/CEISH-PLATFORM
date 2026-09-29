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
    <div className="obs-form">
      <div className="obs-form__field">
        <label className="obs-form__label">Observación</label>
        <textarea
          className="obs-form__textarea"
          placeholder="Describe el problema o hallazgo encontrado..."
          value={criterion.observation}
          onChange={(e) => handleObsChange(e.target.value)}
          rows={3}
        />
      </div>
      <div className="obs-form__field">
        <label className="obs-form__label">Referencia de página</label>
        <div className="obs-form__page-row">
          <input
            type="number"
            className="obs-form__page-input"
            placeholder="Pág."
            value={criterion.pageReference?.toString() ?? ''}
            onChange={(e) => handlePageRefChange(e.target.value)}
            min={1}
          />
          <button className="obs-form__use-current" onClick={useCurrentPage} type="button">
            Usar página actual ({currentPdfPage})
          </button>
        </div>
      </div>
    </div>
  );
}
