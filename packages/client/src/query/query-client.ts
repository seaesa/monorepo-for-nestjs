import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ErrorCode } from '@repo/contracts';

import { ApiError } from '../http/api-error';

export interface QueryClientOptions {
  /** Global error sink (toast). Mutations that handle errors themselves set `meta: { silent: true }`. */
  onError?: (error: ApiError) => void;
}

/** Lists refetch on focus at most this often; realtime events keep them fresh in between. */
const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

const NO_RETRY = new Set<ErrorCode>([
  ErrorCode.UNAUTHORIZED,
  ErrorCode.FORBIDDEN,
  ErrorCode.NOT_FOUND,
  ErrorCode.VALIDATION_FAILED,
  ErrorCode.AUTH_TOKEN_INVALID,
  ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
  ErrorCode.AUTH_RESET_TOKEN_INVALID,
  ErrorCode.AUTH_VERIFICATION_TOKEN_INVALID,
  ErrorCode.AUTH_SESSION_NOT_FOUND,
]);

export function createQueryClient({ onError }: QueryClientOptions = {}): QueryClient {
  const report = (error: unknown, meta?: Record<string, unknown>) => {
    if (error instanceof ApiError && !meta?.silent) onError?.(error);
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: (error, query) => report(error, query.meta) }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => report(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: (count, error) =>
          !(error instanceof ApiError && NO_RETRY.has(error.code)) && count < MAX_RETRIES,
      },
      mutations: { retry: false },
    },
  });
}

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
    queryMeta: { silent?: boolean };
    mutationMeta: { silent?: boolean };
  }
}
