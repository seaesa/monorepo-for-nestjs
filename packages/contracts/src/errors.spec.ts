import { describe, expect, it } from '@jest/globals';

import { ErrorCode, errorStatus, isApiErrorBody } from './errors';

describe('error codes', () => {
  it('every code maps to an HTTP error status', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(errorStatus[code]).toBeGreaterThanOrEqual(400);
      expect(errorStatus[code]).toBeLessThan(600);
    }
  });

  it('codes are unique', () => {
    const values = Object.values(ErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('isApiErrorBody', () => {
  const body = {
    statusCode: 404,
    code: ErrorCode.NOT_FOUND,
    message: 'The resource was not found.',
    timestamp: new Date().toISOString(),
    path: '/users/123',
  };

  it('accepts a well formed error body', () => {
    expect(isApiErrorBody(body)).toBe(true);
  });

  it('rejects unrelated payloads', () => {
    expect(isApiErrorBody(null)).toBe(false);
    expect(isApiErrorBody('nope')).toBe(false);
    expect(isApiErrorBody({ message: 'missing code' })).toBe(false);
  });
});
