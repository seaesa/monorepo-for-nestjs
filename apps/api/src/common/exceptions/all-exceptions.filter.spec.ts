import {
  type ArgumentsHost,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';

import { ErrorCode } from '@repo/contracts';
import { resources } from '@repo/i18n';

import { AllExceptionsFilter } from './all-exceptions.filter';
import { AppException } from './app.exception';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ id: 'req-1', url: '/test' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { status: (status.mock.calls[0] as unknown[])[0], body: json.mock.calls[0][0] };
}

describe('AllExceptionsFilter', () => {
  beforeAll(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));

  it('serializes AppException with field binding', () => {
    const { status, body } = run(new AppException(ErrorCode.AUTH_EMAIL_TAKEN, { field: 'email' }));
    expect(status).toBe(409);
    expect(body).toMatchObject({
      code: ErrorCode.AUTH_EMAIL_TAKEN,
      requestId: 'req-1',
      fieldErrors: [{ path: 'email', code: ErrorCode.AUTH_EMAIL_TAKEN }],
    });
  });

  it('maps ZodError to VALIDATION_FAILED with dotted paths', () => {
    const result = z
      .object({ items: z.array(z.object({ name: z.string() })) })
      .safeParse({ items: [{}] });
    const { status, body } = run(result.error);
    expect(status).toBe(422);
    expect(body.fieldErrors[0].path).toBe('items.0.name');
  });

  it('maps Nest HttpExceptions by status', () => {
    expect(run(new NotFoundException()).body.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('keeps 503 as SERVICE_UNAVAILABLE so load balancers see the right status', () => {
    const { status, body } = run(new ServiceUnavailableException());
    expect(status).toBe(503);
    expect(body.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
  });

  it('reports a dead Redis as SERVICE_UNAVAILABLE, not a generic 500', () => {
    const { status, body } = run(new Error('Connection is closed.'));
    expect(status).toBe(503);
    expect(body.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
  });

  it('does not leak framework messages to the client', () => {
    const { body } = run(new NotFoundException('Cannot GET /nope'));
    expect(body.message).toBe(resources.en.errors.NOT_FOUND);
    expect(body.message).not.toContain('/nope');
  });

  it('hides unknown errors behind INTERNAL_ERROR', () => {
    const { status, body } = run(new Error('db password leaked'));
    expect(status).toBe(500);
    expect(body.message).not.toContain('password');
  });
});
