import { type AuthSession, contract } from '@repo/contracts';

import { getClientConfig, request } from '../http/client';
import { useAuthStore } from './auth-store';
import { tokenStorage } from './token-storage';

/** After sign-in / register: keep bearer tokens (mobile) and mark the user signed in. */
export async function startSession({ user, tokens }: AuthSession): Promise<void> {
  if (tokens) await tokenStorage.set(tokens);
  useAuthStore.getState().signIn(user);
}

export async function endSession(): Promise<void> {
  await tokenStorage.clear();
  useAuthStore.getState().signOut();
}

/** Resolves `status` from `unknown` at start-up by asking the API who we are. */
export async function restoreSession(): Promise<void> {
  const { auth } = getClientConfig();
  if (auth.mode === 'bearer' && !(await tokenStorage.load(auth.tokenStorage))) {
    useAuthStore.getState().signOut();
    return;
  }
  try {
    useAuthStore.getState().signIn(await request(contract.auth.me));
  } catch {
    await endSession();
  }
}

/** Body for `contract.auth.logout`: the cookie carries the refresh token on web. */
export function logoutBody(): { refreshToken?: string } {
  return { refreshToken: tokenStorage.get()?.refreshToken };
}
