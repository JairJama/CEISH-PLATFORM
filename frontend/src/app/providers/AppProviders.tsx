import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { getSession } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  const setUser = useAuthStore((state) => state.setUser);
  const finishRestore = useAuthStore((state) => state.finishRestore);

  useEffect(() => {
    getSession().then((user) => { if (user) setUser(user); }).finally(finishRestore);
  }, [finishRestore, setUser]);

  return <>{children}</>;
}
