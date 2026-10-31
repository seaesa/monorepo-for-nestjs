import { describe, expect, it } from '@jest/globals';

import { ErrorCode } from '@repo/contracts';

import { ApiError, toApiError } from './api-error';

/** Shape axios uses for its errors, without spinning up a real request. */
function axiosFailure(options: { status?: number; data?: unknown }): unknown {
  return Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response:
      options.status === undefined
        ? undefined
        : { status: options.status, data: options.data, statusText: '', headers: {} },
  });
}

describe('ApiError', () => {
  const body = {
    statusCode: 404,
    code: ErrorCode.NOT_FOUND,
    message: 'The resource was not found.',
  };

  it('exposes the stable fields frontends branch on', () => {
    const error = new ApiError({ ...body, requestId: 'req-1' });
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.status).toBe(404);
    expect(error.requestId).toBe('req-1');
    expect(error.fieldErrors).toEqual([]);
    expect(error).toBeInstanceOf(Error);
  });

  it('answers is() by code, not by message', () => {
    const error = new ApiError(body);
    expect(error.is(ErrorCode.NOT_FOUND)).toBe(true);
    expect(error.is(ErrorCode.FORBIDDEN)).toBe(false);
  });
});

describe('toApiError', () => {
  it('returns an ApiError untouched', () => {
    const error = new ApiError({ statusCode: 409, code: ErrorCode.CONFLICT, message: 'taken' });
    expect(toApiError(error)).toBe(error);
  });

  it('keeps the contract body, including field errors', () => {
    const translated = toApiError(
      axiosFailure({
        status: 409,
        data: {
          statusCode: 409,
          code: ErrorCode.AUTH_EMAIL_TAKEN,
          message: 'Email already registered',
          fieldErrors: [{ path: 'email', code: 'custom', message: 'Email already registered' }],
          requestId: 'req-2',
          timestamp: new Date().toISOString(),
          path: '/auth/register',
        },
      }),
    );

    expect(translated.code).toBe(ErrorCode.AUTH_EMAIL_TAKEN);
    expect(translated.fieldErrors).toHaveLength(1);
    expect(translated.fieldErrors[0]?.path).toBe('email');
    expect(translated.requestId).toBe('req-2');
  });

  it('maps a request that never reached the server to NETWORK_ERROR with status 0', () => {
    const translated = toApiError(axiosFailure({}));
    expect(translated.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(translated.status).toBe(0);
  });

  it('falls back to INTERNAL_ERROR when the body is not ours, keeping the status', () => {
    const translated = toApiError(axiosFailure({ status: 502, data: '<html>bad gateway</html>' }));
    expect(translated.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(translated.status).toBe(502);
  });

  it('normalises non-axios throwables', () => {
    const translated = toApiError(new Error('boom'));
    expect(translated.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(translated.status).toBe(0);
  });
});
