import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RegistrationRequest, RegistrationResult, ResearcherType } from '../../services/authService';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Input from '../../shared/components/common/Input';
import { cn } from '../../utils/cn';

interface RegistrationFormProps {
  onSubmit: (request: RegistrationRequest) => Promise<RegistrationResult>;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [researcherType, setResearcherType] = useState<ResearcherType>('internal');
  const [affiliation, setAffiliation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword || (researcherType === 'external' && !affiliation.trim())) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setError('Ingresa un correo válido.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    const result = await onSubmit({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      researcherType,
      affiliation: affiliation.trim(),
    });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo enviar la solicitud.');
      return;
    }
    setSuccess(result.message ?? 'Solicitud enviada correctamente.');
  };

  return (
    <Card variant="elevated" padding="md">
      <div className="mb-5">
        <h1 className="text-slate-900 text-[26px] font-semibold tracking-[-0.03em]">
          Solicitud de registro
        </h1>
        <p className="mt-1 text-slate-600 text-[13px]">
          Envía tus datos para que un administrador revise y habilite tu acceso.
        </p>
      </div>

      <div className="h-0.5 mb-5 bg-gradient-to-r from-[#ef3e3a] to-transparent" />

      {error && (
        <div
          className="flex items-start gap-2.5 mb-4 px-3.5 py-2.5 rounded-[7px] border border-red-200 bg-red-50 text-[#b91c1c] text-[13px]"
          role="alert"
        >
          <span aria-hidden="true">⚠️</span>
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div
          className="flex items-start gap-2.5 mb-4 px-3.5 py-2.5 rounded-[7px] border border-emerald-200 bg-emerald-50 text-emerald-800 text-[13px]"
          role="status"
        >
          <span aria-hidden="true">✓</span>
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mb-5" noValidate>
        <Input
          label="Nombres y apellidos"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={isLoading}
          autoComplete="name"
        />
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
        />

        <fieldset className="border-0 p-0 m-0 text-slate-700" disabled={isLoading}>
          <legend className="mb-1.5 text-[12px] font-semibold text-slate-700">
            Tipo de investigador <span className="text-[#ef3e3a]" aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label
              className={cn(
                'flex items-start gap-2 p-2.5 border rounded-[7px] cursor-pointer transition-colors',
                researcherType === 'internal'
                  ? 'border-[#ef3e3a] bg-red-50/70'
                  : 'border-slate-300 bg-white hover:border-slate-400',
              )}
            >
              <input
                type="radio"
                name="researcherType"
                value="internal"
                checked={researcherType === 'internal'}
                onChange={() => setResearcherType('internal')}
                className="mt-0.5 accent-[#ef3e3a]"
              />
              <span>
                <strong className="block text-[11px] font-semibold text-slate-900">Investigador interno</strong>
                <small className="block text-[10px] text-slate-500">Vinculado a Uleam</small>
              </span>
            </label>
            <label
              className={cn(
                'flex items-start gap-2 p-2.5 border rounded-[7px] cursor-pointer transition-colors',
                researcherType === 'external'
                  ? 'border-[#ef3e3a] bg-red-50/70'
                  : 'border-slate-300 bg-white hover:border-slate-400',
              )}
            >
              <input
                type="radio"
                name="researcherType"
                value="external"
                checked={researcherType === 'external'}
                onChange={() => setResearcherType('external')}
                className="mt-0.5 accent-[#ef3e3a]"
              />
              <span>
                <strong className="block text-[11px] font-semibold text-slate-900">Investigador externo</strong>
                <small className="block text-[10px] text-slate-500">Otra institución</small>
              </span>
            </label>
          </div>
        </fieldset>

        {researcherType === 'external' && (
          <Input
            label="Institución de procedencia"
            name="affiliation"
            value={affiliation}
            onChange={(event) => setAffiliation(event.target.value)}
            required
            disabled={isLoading}
            autoComplete="organization"
          />
        )}
        <Input
          label="Contraseña"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={isLoading}
          autoComplete="new-password"
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          disabled={isLoading}
          autoComplete="new-password"
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
          {isLoading ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-200 text-slate-500 text-xs text-center">
        <p>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-[#ef3e3a] font-semibold hover:text-[#d92f2c] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </Card>
  );
};

export default RegistrationForm;
