import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RegistrationRequest, RegistrationResult, ResearcherType } from '../../services/authService';
import { colors, typography } from '../../shared/components/common/colors';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Input from '../../shared/components/common/Input';
import './LoginForm.css';

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
      <div className="login-form__header">
        <h1 className="login-form__title" style={{ color: colors.surface.dark, fontFamily: typography.fontFamily.display }}>
          Solicitud de registro
        </h1>
        <p className="login-form__subtitle" style={{ color: colors.gray[600], fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body }}>
          Envía tus datos para que un administrador revise y habilite tu acceso.
        </p>
      </div>

      <div className="login-form__divider-top" style={{ background: `linear-gradient(90deg, ${colors.primary[500]} 0%, ${colors.success[500]} 100%)` }} />

      {error && <div className="login-form__alert login-form__alert--error" role="alert"><span className="login-form__alert-icon">⚠️</span><p className="login-form__alert-text">{error}</p></div>}
      {success && <div className="login-form__alert login-form__alert--success" role="status"><span className="login-form__alert-icon">✓</span><p className="login-form__alert-text">{success}</p></div>}

      <form onSubmit={handleSubmit} className="login-form__form" noValidate>
        <Input label="Nombres y apellidos" name="name" value={name} onChange={(event) => setName(event.target.value)} required disabled={isLoading} autoComplete="name" />
        <Input label="Correo electrónico" type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} autoComplete="email" />

        <fieldset className="registration-form__type" disabled={isLoading}>
          <legend>Tipo de investigador <span aria-hidden="true">*</span></legend>
          <label><input type="radio" name="researcherType" value="internal" checked={researcherType === 'internal'} onChange={() => setResearcherType('internal')} /> Investigador interno</label>
          <label><input type="radio" name="researcherType" value="external" checked={researcherType === 'external'} onChange={() => setResearcherType('external')} /> Investigador externo</label>
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
        <Input label="Contraseña" type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} autoComplete="new-password" />
        <Input label="Confirmar contraseña" type="password" name="confirmPassword" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required disabled={isLoading} autoComplete="new-password" />

        <Button type="submit" variant="primary" size="sm" fullWidth isLoading={isLoading} disabled={isLoading} className="login-form__submit">
          {isLoading ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </form>

      <div className="login-form__footer" style={{ borderTop: `1px solid ${colors.border}`, color: colors.gray[500], fontSize: typography.fontSize.xs }}>
        <p>¿Ya tienes una cuenta? <Link to="/login" className="login-form__footer-link" style={{ color: colors.primary[500] }}>Inicia sesión</Link></p>
      </div>
    </Card>
  );
};

export default RegistrationForm;
