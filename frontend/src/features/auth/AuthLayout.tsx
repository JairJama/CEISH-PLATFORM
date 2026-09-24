import React from 'react';
import { colors, spacing } from '../../shared/components/common/colors';
import Logo from '../../shared/components/common/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout Mejorado
 * Diseño moderno con layout full-screen, gradientes sofisticados y proporciones optimizadas
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.surface.light,
        margin: 0,
        padding: 0,
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-layout__left-section {
          display: none;
        }

        .auth-layout__right-section {
          animation: slideInLeft 0.6s ease-out;
        }

        .auth-layout__content {
          animation: fadeInUp 0.8s ease-out;
        }

        @media (min-width: 1024px) {
          .auth-layout__left-section {
            display: flex;
          }

          .auth-layout__right-section {
            animation: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-layout__left-section,
          .auth-layout__right-section,
          .auth-layout__content {
            animation: none;
          }
        }
      `}</style>

      {/* Sección izquierda - Información institucional */}
      <div
        className="auth-layout__left-section"
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing['3xl'],
          background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[500]} 50%, ${colors.success[600]} 100%)`,
          color: colors.surface.light,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Elementos decorativos de fondo */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-100px',
            right: '-100px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            bottom: '-50px',
            left: '-50px',
          }}
        />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size="lg" hideIcon />

          <div
            style={{
              marginTop: spacing['3xl'],
              textAlign: 'center',
              maxWidth: '420px',
            }}
          >
            <h2
              style={{
                fontSize: '2.25rem',
                fontWeight: 700,
                margin: 0,
                marginBottom: spacing.lg,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              Plataforma de Revisión Académica
            </h2>

            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: 1.6,
                marginTop: spacing.lg,
                opacity: 0.95,
                margin: 0,
              }}
            >
              Gestiona y evalúa documentos académicos de manera confiable y segura
            </p>

            <div
              style={{
                marginTop: spacing['2xl'],
                paddingTop: spacing['2xl'],
                borderTop: `1px solid rgba(255, 255, 255, 0.2)`,
                fontSize: '0.875rem',
                opacity: 0.8,
              }}
            >
              <p style={{ margin: 0, fontStyle: 'italic' }}>
                Innovando la evaluación académica en Uleam
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección derecha - Formulario */}
      <div
        className="auth-layout__right-section"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing['2xl'],
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="auth-layout__content"
          style={{
            width: '100%',
            maxWidth: '440px',
            margin: '0 auto',
          }}
        >
          {/* Logo en versiones móvil */}
          <div className="auth-layout__mobile-logo">
            <Logo size="md" hideIcon />
          </div>

          {children}

          {/* Footer */}
          <div
            style={{
              marginTop: spacing['3xl'],
              paddingTop: spacing['2xl'],
              borderTop: `1px solid ${colors.border}`,
              textAlign: 'center',
              fontSize: '0.875rem',
              color: colors.gray[500],
            }}
          >
            <p style={{ margin: 0, fontWeight: 500}}>
              © 2026 Uleam
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
              Plataforma CEISH
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
