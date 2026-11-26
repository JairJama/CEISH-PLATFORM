import { useEffect, useState } from 'react';
import { workflowService, type RegistrationRequestItem } from '../../../services/workflowService';
import { badgeClass, btnClass, pageLayout, spinnerClass } from '../../../shared/components/common/ui';

const STATUS_LABEL = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
} as const;

const STATUS_VARIANT = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
} as const;

export function RegistrationRequestsPanel() {
  const [requests, setRequests] = useState<RegistrationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'internal' | 'external'>('all');

  useEffect(() => {
    void workflowService.getRegistrationRequests()
      .then(setRequests)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  const review = async (id: string, decision: 'approved' | 'rejected') => {
    setProcessingId(id);
    setError(null);
    try {
      const updated = await workflowService.reviewRegistration(id, decision);
      setRequests((current) => current.map((item) => item.id === id ? updated : item));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'pending').length;
  const filteredRequests = requests.filter((request) => {
    const matchesSearch = `${request.name} ${request.email}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (type === 'all' || request.researcher_type === type);
  });

  return (
    <div className={pageLayout.root}>
      <div className={pageLayout.header}>
        <div>
          <span className={pageLayout.kicker}>ESPACIO CEISH</span>
          <h1 className={pageLayout.title}>Solicitudes de investigadores</h1>
          <p className={pageLayout.subtitle}>{pendingCount} solicitudes pendientes de revisión</p>
        </div>
      </div>

      <div className={pageLayout.body}>
        {error && <div className={pageLayout.alertError} role="alert">{error}</div>}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-3 border border-slate-200 rounded-[9px] bg-white shadow-xs">
          <label className="flex-1 min-w-[200px]">
            <span className="sr-only">Buscar solicitudes</span>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-[7px] bg-white text-slate-900 text-[13px] outline-none focus:border-[#ef3e3a] focus:ring-2 focus:ring-[#ef3e3a]/15 placeholder:text-slate-400"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o correo..."
            />
          </label>
          <select
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-[7px] bg-white text-slate-900 text-[13px] outline-none focus:border-[#ef3e3a]"
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
          >
            <option value="all">Todos los tipos</option>
            <option value="internal">Investigador interno</option>
            <option value="external">Investigador externo</option>
          </select>
          <span className="text-slate-500 text-[11px] whitespace-nowrap">{filteredRequests.length} resultados</span>
        </div>

        {loading ? (
          <div className={pageLayout.loading}>
            <div className={spinnerClass} />
            <span>Cargando...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className={pageLayout.emptyState}>
            <p className={pageLayout.emptyTitle}>No hay solicitudes registradas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(220px,1.2fr)_1fr_auto_auto] items-center gap-3 md:gap-[18px] px-5 py-4 bg-white border border-slate-200 rounded-[9px] shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-red-100 text-[#d92f2c] font-bold">
                    {request.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold text-slate-900 truncate">{request.name}</h2>
                    <p className="text-[12px] text-slate-500 mt-0.5 truncate">{request.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 text-[12px] text-slate-600">
                  <span>{request.researcher_type === 'internal' ? 'Investigador interno' : 'Investigador externo'}</span>
                  {request.affiliation && <span>{request.affiliation}</span>}
                  <span className="text-slate-400">{new Date(request.created_at).toLocaleDateString('es-EC')}</span>
                </div>
                <span className={badgeClass(STATUS_VARIANT[request.status], 'w-fit')}>
                  {STATUS_LABEL[request.status]}
                </span>
                {request.status === 'pending' && (
                  <div className="flex gap-2 justify-end">
                    <button
                      className={btnClass('dangerOutline')}
                      disabled={processingId === request.id}
                      onClick={() => void review(request.id, 'rejected')}
                      type="button"
                    >
                      Rechazar
                    </button>
                    <button
                      className={btnClass('primary')}
                      disabled={processingId === request.id}
                      onClick={() => void review(request.id, 'approved')}
                      type="button"
                    >
                      {processingId === request.id ? 'Procesando...' : 'Aceptar'}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
