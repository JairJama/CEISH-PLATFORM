import { create } from 'zustand';
import type { User } from '../shared/types/platform.types';

interface AuthState {
  currentUser: User | null;
  isRestored: boolean;
  setUser: (user: User) => void;
  finishRestore: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isRestored: false,
  setUser: (user) => set({ currentUser: user }),
  finishRestore: () => set({ isRestored: true }),
  logout: () => set({ currentUser: null }),
}));
