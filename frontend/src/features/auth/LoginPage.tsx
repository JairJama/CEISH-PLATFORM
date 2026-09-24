// src/features/auth/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import LoginForm from './LoginForm';
import { login } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

/**
 * Página de login — orquesta authService + authStore + navegación.
 * LoginForm solo recibe onSubmit y no sabe nada de rutas ni stores.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser); // ajusta al nombre real de tu action

  const handleSubmit = async (email: string, password: string) => {
    const result = await login(email, password);

    if (result.success && result.user) {
      setUser(result.user);

      // Redirigir según rol (igual que hace RootRedirect)
      const routes: Record<string, string> = {
        student: '/estudiante',
        evaluator: '/evaluador/estratificacion',
        admin: '/admin',
      };
      navigate(routes[result.user.role] ?? '/');
    }

    return result;
  };

  return (
    <AuthLayout>
      <LoginForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
};
