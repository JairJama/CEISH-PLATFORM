import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const Brand = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-3 text-[#ef3e3a]">
    <svg width={compact ? 34 : 46} height={compact ? 34 : 46} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <rect width="46" height="46" rx="13" fill="currentColor" />
      <path d="M23 10l10 4.7V21c0 6.3-4.2 10.5-10 12.4C17.2 31.5 13 27.3 13 21v-6.3L23 10z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18.5 22.5l3 3 6.2-6.4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="grid gap-1">
      <strong className="text-slate-900 text-[18px] tracking-[0.13em] leading-none">CEISH</strong>
      <small className="text-slate-500 text-[8px] font-extrabold tracking-[0.18em] leading-none">PLATFORM</small>
    </span>
  </div>
);

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <main className="grid h-[100dvh] overflow-y-auto grid-cols-1 lg:grid-cols-[minmax(360px,46%)_1fr] bg-slate-50 text-slate-900">
    <section
      className="hidden lg:flex relative min-h-[100dvh] flex-col justify-between overflow-hidden py-12 px-[clamp(38px,6vw,96px)] border-r border-slate-200 bg-[#f8fafc] bg-[radial-gradient(circle_at_78%_21%,rgba(239,62,58,0.10),transparent_28%),linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:auto,28px_28px,28px_28px]"
      aria-label="Información institucional"
    >
      <Brand />
      <div className="max-w-[530px] my-auto">
        <p className="mb-[18px] text-[#ef3e3a] text-[10px] font-extrabold tracking-[0.13em]">
          COMITÉ DE ÉTICA DE INVESTIGACIÓN EN SERES HUMANOS
        </p>
        <h1 className="max-w-[490px] m-0 text-slate-900 text-[clamp(36px,4.1vw,56px)] font-semibold tracking-[-0.045em] leading-[1.03]">
          La investigación ética empieza aquí.
        </h1>
        <span className="block max-w-[440px] mt-5 text-slate-600 text-[15px] leading-[1.7]">
          Gestiona tus investigaciones y acompaña cada proceso de revisión de forma segura, trazable y transparente.
        </span>
      </div>
      <div className="flex items-center gap-2.5 text-slate-500 text-[11px]">
        <b className="grid w-7 h-7 place-items-center border border-emerald-300 bg-emerald-50 rounded-full text-emerald-700 font-bold">
          ✓
        </b>
        <span>
          <strong className="block text-slate-800 text-[11px]">Acceso seguro</strong>
          Datos institucionales protegidos
        </span>
      </div>
    </section>

    <section className="flex min-w-0 min-h-[100dvh] flex-col items-center justify-center px-5 py-7 sm:p-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(239,62,58,0.07),transparent_48%)] bg-slate-100/70">
      <div className="lg:hidden mb-7">
        <Brand compact />
      </div>
      <div className="w-full max-w-[450px]">{children}</div>
      <footer className="mt-6 text-slate-500 text-[11px]">© 2026 Uleam · Plataforma CEISH</footer>
    </section>
  </main>
);

export default AuthLayout;
