import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import RegistrationForm from './RegistrationForm';
import { register } from '../../services/authService';

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <RegistrationForm
        onSubmit={register}
        onSuccess={() => navigate('/login', { replace: true })}
      />
    </AuthLayout>
  );
};
