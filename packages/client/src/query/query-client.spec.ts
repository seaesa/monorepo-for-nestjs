import { describe, expect, it } from '@jest/globals';

import { ErrorCode } from '@repo/contracts';

import { ApiError } from '../http/api-error';
import { createQueryClient } from './query-client';

type RetryFn = (failureCount: number, error: unknown) => boolean;

function retryPolicy(): RetryFn {
  const client = createQueryClient();
  const retry = client.getDefaultOptions().queries?.retry;
  if (typeof retry !== 'function') throw new Error('expected a retry function');
  return retry as RetryFn;
}

describe('createQueryClient', () => {
  const retry = retryPolicy();

  it('refuses to retry errors that will not change', () => {
    for (const code of [
      ErrorCode.NOT_FOUND,
      ErrorCode.VALIDATION_FAILED,
      ErrorCode.UNAUTHORIZED,
      ErrorCode.AUTH_TOKEN_INVALID,
    ]) {
      const error = new ApiError({ statusCode: 400, code, message: 'nope' });
      expect(retry(0, error)).toBe(false);
    }
  });

  it('retries transient failures twice, then stops', () => {
    const error = new ApiError({
      statusCode: 503,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: 'down',
    });
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });

  it('does not retry unrecognised throwables forever', () => {
    expect(retry(0, new Error('boom'))).toBe(true);
    expect(retry(2, new Error('boom'))).toBe(false);
  });

  it('never retries mutations: a write must not run twice', () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it('keeps cached data warm for 30 seconds', () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
  });
});
