import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout as logoutSession } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const STUDENT_NAV: NavItem[] = [
  {
    to: '/investigador',
    label: 'Investigaciones',
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
    label: 'Investigadores',
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
];

const ROLE_NAV = { student: STUDENT_NAV, evaluator: EVALUATOR_NAV, admin: ADMIN_NAV };
const ROLE_LABEL = { student: 'Investigador', evaluator: 'Estratificador CEISH', admin: 'Administrador' };

export function AppShell() {
  const { currentUser, isRestored, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutSession();
    logout();
    navigate('/login', { replace: true });
  };

  if (!isRestored) return null;
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const navItems = ROLE_NAV[currentUser.role];
  const activeItem = navItems.find((item) => location.pathname === item.to) ?? navItems[0];

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-slate-50 text-slate-900">
      <aside className="w-full md:w-[258px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between md:justify-start gap-2.5 px-4 py-3 md:min-h-[88px] md:px-6 md:py-6">
          <div className="flex items-center gap-3">
            <svg
              className="text-[#ef3e3a] drop-shadow-[0_6px_12px_rgba(239,62,58,0.22)] shrink-0"
              width="34"
              height="34"
              viewBox="0 0 34 34"
              fill="none"
              aria-hidden="true"
            >
              <rect width="34" height="34" rx="10" fill="currentColor" />
              <path d="M17 7.5l8 3.8v5.1c0 5.1-3.4 8.6-8 10.1-4.6-1.5-8-5-8-10.1v-5.1l8-3.8z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M13.4 17l2.3 2.3 4.9-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex flex-col">
              <span className="text-slate-900 text-[15px] font-bold tracking-[0.12em] leading-none">CEISH</span>
              <span className="mt-1.5 text-slate-400 text-[8px] font-bold tracking-[0.18em] leading-none">PLATFORM</span>
            </span>
          </div>

          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2M7 11l3-3-3-3M10 8H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 mx-5 mb-5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[9px]">
          <span className="grid w-7 h-7 place-items-center rounded-md bg-red-50 border border-red-100 text-[#ef3e3a] text-[18px] shrink-0">
            ⌑
          </span>
          <span className="min-w-0">
            <small className="block text-slate-500 text-[10px] leading-snug">Espacio de trabajo</small>
            <strong className="block text-slate-900 text-[12px] font-semibold leading-snug truncate">
              {ROLE_LABEL[currentUser.role]}
            </strong>
          </span>
        </div>

        <nav className="flex-1 flex flex-row md:flex-col gap-1 px-3 pb-2.5 md:px-4 md:pb-4 overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
          <p className="hidden md:block mx-3 mb-2 text-slate-400 text-[9px] font-extrabold tracking-[0.11em]">
            MENÚ PRINCIPAL
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'shrink-0 flex items-center gap-2.5 md:gap-3 min-h-[38px] md:min-h-[40px] px-3 py-2 rounded-[7px] text-[12.5px] md:text-[13px] font-medium no-underline transition-colors border-b-2 md:border-b-0 md:border-l-2',
                  isActive
                    ? 'bg-red-50/90 border-[#ef3e3a] text-[#d92f2c] font-semibold'
                    : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5 mx-4 py-4 px-2 border-t border-slate-200">
          <div className="w-[30px] h-[30px] rounded-full bg-red-100 text-[#d92f2c] flex items-center justify-center text-[12px] font-bold shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-900 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{ROLE_LABEL[currentUser.role]}</p>
          </div>
          <button
            className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2M7 11l3-3-3-3M10 8H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      <section className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <header className="flex items-center justify-between h-[49px] px-4 sm:px-6 lg:px-[39px] bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>Panel</span>
            <b className="text-slate-300 text-[17px] font-normal">›</b>
            <strong className="text-slate-800 font-semibold">{activeItem.label}</strong>
          </div>
          <div className="flex items-center gap-5">
            <button
              className="relative grid w-[22px] h-6 place-items-center text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Notificaciones"
              type="button"
            >
              <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
                <path d="M15.5 8.1c0-3.4-1.8-5.6-5-5.6s-5 2.2-5 5.6c0 3.8-1.5 4.7-1.5 5.6h13c0-.9-1.5-1.8-1.5-5.6zM8.4 16.3h4.2" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <i className="absolute top-0.5 right-0 w-1.5 h-1.5 border border-white rounded-full bg-[#ef3e3a]" />
            </button>
            <span className="grid w-[29px] h-[29px] place-items-center rounded-full bg-red-100 text-[#d92f2c] text-[10px] font-extrabold">
              {currentUser.name.charAt(0)}
            </span>
          </div>
        </header>
        <main className="relative flex-1 min-w-0 min-h-0 overflow-y-auto bg-[#f8fafc] bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px),radial-gradient(ellipse_at_40%_0%,rgba(239,62,58,0.05),transparent_54%)] bg-[size:26px_26px,26px_26px,auto]">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
