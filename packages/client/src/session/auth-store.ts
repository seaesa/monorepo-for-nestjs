import { create } from 'zustand';

import type { User } from '@repo/contracts';

/** `unknown` until the stored session has been checked at start-up. Gate redirects on it. */
export type AuthStatus = 'unknown' | 'signedIn' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  signIn: (user: User) => void;
  setUser: (user: User) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'unknown',
  user: null,
  signIn: (user) => set({ status: 'signedIn', user }),
  setUser: (user) => set({ user }),
  signOut: () => set({ status: 'signedOut', user: null }),
}));

export const useIsAuthenticated = (): boolean => useAuthStore((s) => s.status === 'signedIn');
