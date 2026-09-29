import { useEffect, useState } from 'react';
import { workflowService, type RegistrationRequestItem } from '../../../services/workflowService';
import '../admin.css';

const STATUS_LABEL = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
} as const;

export function RegistrationRequestsPanel() {
  const [requests, setRequests] = useState<RegistrationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Solicitudes de investigadores</h1>
          <p className="page__subtitle">{pendingCount} solicitudes pendientes de revisión</p>
        </div>
      </div>

      <div className="page__body">
        {error && <div className="workflow-alert workflow-alert--error" role="alert">{error}</div>}
        {loading ? (
          <div className="page__loading"><div className="pdf-spinner" /><span>Cargando...</span></div>
        ) : requests.length === 0 ? (
          <div className="empty-state"><p className="empty-state__title">No hay solicitudes registradas</p></div>
        ) : (
          <div className="request-list">
            {requests.map((request) => (
              <article key={request.id} className="request-card">
                <div className="request-card__identity">
                  <span className="request-card__avatar">{request.name.charAt(0)}</span>
                  <div>
                    <h2>{request.name}</h2>
                    <p>{request.email}</p>
                  </div>
                </div>
                <div className="request-card__details">
                  <span>{request.researcher_type === 'internal' ? 'Investigador interno' : 'Investigador externo'}</span>
                  {request.affiliation && <span>{request.affiliation}</span>}
                  <span>{new Date(request.created_at).toLocaleDateString('es-EC')}</span>
                </div>
                <span className={`badge request-card__status request-card__status--${request.status}`}>
                  {STATUS_LABEL[request.status]}
                </span>
                {request.status === 'pending' && (
                  <div className="request-card__actions">
                    <button
                      className="eval-btn eval-btn--danger-outline"
                      disabled={processingId === request.id}
                      onClick={() => void review(request.id, 'rejected')}
                    >
                      Rechazar
                    </button>
                    <button
                      className="eval-btn eval-btn--primary"
                      disabled={processingId === request.id}
                      onClick={() => void review(request.id, 'approved')}
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
