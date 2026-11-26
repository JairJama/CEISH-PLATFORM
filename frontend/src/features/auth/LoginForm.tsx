// src/features/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LoginResult } from '../../services/authService';
import Input from '../../shared/components/common/Input';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';

interface LoginFormProps {
  /** Recibe email y password, devuelve LoginResult */
  onSubmit: (email: string, password: string) => Promise<LoginResult>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Ingresa un correo válido';
    if (!password) next.password = 'La contraseña es requerida';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearFieldError = (field: 'email' | 'password') => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const result = await onSubmit(email.trim().toLowerCase(), password);

      if (result.success) {
        setSuccessMessage('Autenticación exitosa. Redirigiendo…');
      } else {
        setGeneralError(result.error ?? 'Error al iniciar sesión. Intenta de nuevo.');
      }
    } catch {
      setGeneralError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" padding="md">
      <div className="mb-5">
        <h1 className="text-slate-900 text-[26px] font-semibold tracking-[-0.03em]">
          Acceso a Plataforma
        </h1>
        <p className="mt-1 text-slate-600 text-[13px]">
          Inicia sesión con tu correo institucional
        </p>
      </div>

      <div className="h-0.5 mb-5 bg-gradient-to-r from-[#ef3e3a] to-transparent" />

      {generalError && (
        <div
          className="flex items-start gap-2.5 mb-4 px-3.5 py-2.5 rounded-[7px] border border-red-200 bg-red-50 text-[#b91c1c] text-[13px]"
          role="alert"
        >
          <span aria-hidden="true">⚠️</span>
          <p>{generalError}</p>
        </div>
      )}

      {successMessage && (
        <div
          className="flex items-start gap-2.5 mb-4 px-3.5 py-2.5 rounded-[7px] border border-emerald-200 bg-emerald-50 text-emerald-800 text-[13px]"
          role="status"
        >
          <span aria-hidden="true">✓</span>
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-5" noValidate>
        <Input
          label="Correo institucional"
          type="email"
          name="email"
          placeholder="usuario@live.uleam.edu.ec"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          error={errors.email}
          required
          disabled={isLoading}
          autoComplete="email"
        />

        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          error={errors.password}
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
          className="mt-1 rounded-[7px]"
        >
          {isLoading ? 'Verificando…' : 'Iniciar sesión'}
        </Button>
      </form>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-slate-400 text-xs font-medium">O</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid gap-2.5">
        <p className="m-0 text-slate-500 text-xs text-center">
          ¿Aún no tienes acceso a la plataforma?
        </p>
        <Link
          to="/registro"
          className="flex items-center justify-center px-3.5 py-3 border border-[#ef3e3a] rounded-[7px] bg-red-50/70 text-[#d92f2c] text-xs font-semibold tracking-[0.02em] no-underline transition-colors hover:bg-red-100 hover:border-[#d92f2c] hover:text-[#b91c1c]"
        >
          Solicitar registro
        </Link>
      </div>
    </Card>
  );
};

export default LoginForm;
