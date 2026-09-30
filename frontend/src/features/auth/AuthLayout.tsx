import type { ReactNode } from 'react';
import './LoginForm.css';

interface AuthLayoutProps {
  children: ReactNode;
}

const Brand = ({ compact = false }: { compact?: boolean }) => (
  <div className={`auth-brand ${compact ? 'auth-brand--compact' : ''}`}>
    <svg width={compact ? 34 : 46} height={compact ? 34 : 46} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <rect width="46" height="46" rx="13" fill="currentColor" />
      <path d="M23 10l10 4.7V21c0 6.3-4.2 10.5-10 12.4C17.2 31.5 13 27.3 13 21v-6.3L23 10z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18.5 22.5l3 3 6.2-6.4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span><strong>CEISH</strong><small>PLATFORM</small></span>
  </div>
);

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <main className="auth-layout">
    <section className="auth-layout__aside" aria-label="Información institucional">
      <Brand />
      <div className="auth-layout__hero">
        <p>COMITÉ DE ÉTICA DE INVESTIGACIÓN EN SERES HUMANOS</p>
        <h1>La investigación ética empieza aquí.</h1>
        <span>Gestiona tus investigaciones y acompaña cada proceso de revisión de forma segura, trazable y transparente.</span>
      </div>
      <div className="auth-layout__security"><b>✓</b><span><strong>Acceso seguro</strong>Datos institucionales protegidos</span></div>
    </section>

    <section className="auth-layout__form-area">
      <div className="auth-layout__mobile-brand"><Brand compact /></div>
      <div className="auth-layout__content">{children}</div>
      <footer className="auth-layout__footer">© 2026 Uleam · Plataforma CEISH</footer>
    </section>
  </main>
);

export default AuthLayout;
