import React from 'react';
import AuthLayout from './AuthLayout';
import RegistrationForm from './RegistrationForm';
import { register } from '../../services/authService';

export const RegistrationPage: React.FC = () => {
  return (
    <AuthLayout>
      <RegistrationForm onSubmit={register} />
    </AuthLayout>
  );
};
