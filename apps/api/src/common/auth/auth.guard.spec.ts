import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { z } from 'zod';

import { ErrorCode, defineRoute } from '@repo/contracts';

import type { AppConfig } from '../../config/app-config.service';
import { Endpoint } from '../contract/endpoint.decorator';
import { AppException } from '../exceptions';
import { AuthGuard } from './auth.guard';
import { Public } from './public.decorator';

const response = z.object({ ok: z.literal(true) });
const openRoute = defineRoute({ method: 'GET', path: '/open', response, auth: false });
const closedRoute = defineRoute({ method: 'GET', path: '/closed', response });

class Handlers {
  open() {}
  closed() {}
  forgotten() {}
  markedPublic() {}
  gateway() {}
}

function descriptor(name: keyof Handlers): PropertyDescriptor {
  const found = Object.getOwnPropertyDescriptor(Handlers.prototype, name);
  if (!found) throw new Error(`no handler ${name}`);
  return found;
}

// Decorate the same way a controller would, so the guard reads real metadata.
Endpoint(openRoute)(Handlers.prototype, 'open', descriptor('open'));
Endpoint(closedRoute)(Handlers.prototype, 'closed', descriptor('closed'));
Public()(Handlers.prototype, 'markedPublic', descriptor('markedPublic'));

interface RequestLike {
  headers: Record<string, string>;
  user?: unknown;
}

function context(handler: keyof Handlers, request: RequestLike, type = 'http'): ExecutionContext {
  const method = Handlers.prototype[handler];
  return {
    getType: () => type,
    getHandler: () => method,
    getClass: () => Handlers,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const config = { get: jest.fn(() => 'access-secret') };
  const guard = new AuthGuard(jwt as unknown as JwtService, config as unknown as AppConfig);

  beforeEach(() => jest.clearAllMocks());

  it('fails closed for a handler that forgot @Endpoint', async () => {
    // Regression guard: an unmarked handler must never become world readable.
    await expect(guard.canActivate(context('forgotten', { headers: {} }))).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
    });
  });

  it('allows routes that opt out of auth', async () => {
    await expect(guard.canActivate(context('open', { headers: {} }))).resolves.toBe(true);
  });

  it('allows @Public() handlers that are not part of the contract', async () => {
    await expect(guard.canActivate(context('markedPublic', { headers: {} }))).resolves.toBe(true);
  });

  it('requires a Bearer token on protected routes', async () => {
    await expect(guard.canActivate(context('closed', { headers: {} }))).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
    });
  });

  it('attaches the decoded user to the request', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'a@b.co', role: 'USER' });
    const request: RequestLike = { headers: { authorization: 'Bearer good-token' } };

    await expect(guard.canActivate(context('closed', request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', email: 'a@b.co', role: 'USER' });
  });

  it('maps a bad signature to AUTH_TOKEN_INVALID', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    await expect(
      guard.canActivate(context('closed', { headers: { authorization: 'Bearer nope' } })),
    ).rejects.toMatchObject({ code: ErrorCode.AUTH_TOKEN_INVALID });
  });

  it('maps TokenExpiredError to AUTH_TOKEN_EXPIRED', async () => {
    const { TokenExpiredError } = await import('@nestjs/jwt');
    jwt.verifyAsync.mockRejectedValue(new TokenExpiredError('jwt expired', new Date()));

    await expect(
      guard.canActivate(context('closed', { headers: { authorization: 'Bearer old' } })),
    ).rejects.toMatchObject({ code: ErrorCode.AUTH_TOKEN_EXPIRED });
  });

  it('leaves WebSocket handshakes to the gateway', async () => {
    await expect(guard.canActivate(context('gateway', { headers: {} }, 'ws'))).resolves.toBe(true);
  });

  it('exposes verify() for the socket gateway', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-2', email: 'c@d.co', role: 'ADMIN' });
    await expect(guard.verify('token')).resolves.toEqual({
      id: 'user-2',
      email: 'c@d.co',
      role: 'ADMIN',
    });
  });

  it('throws AppException (not a bare Error) so the filter can serialise it', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad'));
    await expect(guard.verify('bad')).rejects.toBeInstanceOf(AppException);
  });
});
