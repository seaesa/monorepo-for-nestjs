import type { StateStorage } from 'zustand/middleware';

import { type AuthTokens, authTokensSchema } from '@repo/contracts';

const KEY = 'auth.tokens';

let storage: StateStorage | undefined;
let current: AuthTokens | null = null;

/** Bearer-mode tokens (mobile). Kept in memory for request headers, persisted for restarts. */
export const tokenStorage = {
  async load(next: StateStorage): Promise<AuthTokens | null> {
    storage = next;
    const raw = await next.getItem(KEY);
    const parsed = raw ? authTokensSchema.safeParse(JSON.parse(raw)) : undefined;
    current = parsed?.success ? parsed.data : null;
    return current;
  },
  get: (): AuthTokens | null => current,
  async set(tokens: AuthTokens): Promise<void> {
    current = tokens;
    await storage?.setItem(KEY, JSON.stringify(tokens));
  },
  async clear(): Promise<void> {
    current = null;
    await storage?.removeItem(KEY);
  },
};
