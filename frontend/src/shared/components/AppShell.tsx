import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout as logoutSession } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';
import '../styles/platform.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const STUDENT_NAV: NavItem[] = [
  {
    to: '/estudiante',
    label: 'Mi entrega',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 2h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const EVALUATOR_NAV: NavItem[] = [
  {
    to: '/evaluador/estratificacion',
    label: 'Estratificación',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2l6 3v4c0 3.7-2.5 6-6 7-3.5-1-6-3.3-6-7V5l6-3z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 9l1.6 1.6 3.4-3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/evaluador/calificacion',
    label: 'Calificación',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 2h10v14H4V2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 6h5M6.5 9h5M6.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/evaluador',
    label: 'Mis estudiantes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    to: '/admin',
    label: 'Panel general',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    to: '/admin/solicitudes',
    label: 'Solicitudes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 2h7l3 3v11H4V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11 2v3h3M6.5 9h5M6.5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/admin/investigaciones',
    label: 'Investigaciones',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="2" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/admin/asignaciones',
    label: 'Asignaciones',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const ROLE_NAV = { student: STUDENT_NAV, evaluator: EVALUATOR_NAV, admin: ADMIN_NAV };
const ROLE_LABEL = { student: 'Investigador', evaluator: 'Estratificador CEISH', admin: 'Administrador' };

export function AppShell() {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutSession();
    logout();
    navigate('/login', { replace: true });
  };

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const navItems = ROLE_NAV[currentUser.role];
  const activeItem = navItems.find((item) => location.pathname === item.to) ?? navItems[0];

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__brand">
          <svg className="shell__brand-mark" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <rect width="34" height="34" rx="10" fill="currentColor" />
            <path d="M17 7.5l8 3.8v5.1c0 5.1-3.4 8.6-8 10.1-4.6-1.5-8-5-8-10.1v-5.1l8-3.8z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M13.4 17l2.3 2.3 4.9-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span><span className="shell__brand-name">CEISH</span><span className="shell__brand-subtitle">PLATFORM</span></span>
        </div>

        <div className="shell__workspace">
          <span className="shell__workspace-icon">⌑</span>
          <span><small>Espacio de trabajo</small><strong>{ROLE_LABEL[currentUser.role]}</strong></span>
        </div>

        <nav className="shell__nav">
          <p className="shell__nav-title">MENÚ PRINCIPAL</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => cn('shell__nav-item', isActive && 'shell__nav-item--active')}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shell__user">
          <div className="shell__user-avatar">{currentUser.name.charAt(0)}</div>
          <div className="shell__user-info">
            <p className="shell__user-name">{currentUser.name}</p>
            <p className="shell__user-role">{ROLE_LABEL[currentUser.role]}</p>
          </div>
          <button className="shell__logout" onClick={handleLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2M7 11l3-3-3-3M10 8H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      <section className="shell__main">
        <header className="shell__topbar">
          <div className="shell__breadcrumb"><span>Panel</span><b>›</b><strong>{activeItem.label}</strong></div>
          <div className="shell__topbar-actions">
            <button className="shell__notification" aria-label="Notificaciones">
              <svg width="19" height="19" viewBox="0 0 19 19" fill="none"><path d="M15.5 8.1c0-3.4-1.8-5.6-5-5.6s-5 2.2-5 5.6c0 3.8-1.5 4.7-1.5 5.6h13c0-.9-1.5-1.8-1.5-5.6zM8.4 16.3h4.2" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <i />
            </button>
            <span className="shell__topbar-avatar">{currentUser.name.charAt(0)}</span>
          </div>
        </header>
        <main className="shell__content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
