import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { Request } from 'express';

import { ErrorCode } from '@repo/contracts';

import { AppConfig } from '../../config/app-config.service';
import { getRoute } from '../contract';
import { AppException } from '../exceptions';
import { ACCESS_COOKIE, readCookie } from './auth-cookies';
import type { AccessTokenPayload, AuthUser } from './auth-user';
import { PUBLIC_KEY } from './public.decorator';

function bearerToken(req: Request): string | undefined {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
}

/**
 * Global guard. Accepts a bearer token (mobile) or the httpOnly access cookie (web).
 * Fails **closed**: a request is public only when the contract route says
 * `auth: false` or the handler is marked `@Public()`. A handler that forgot
 * `@Endpoint` gets 401 instead of silently becoming world-readable.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Gateways and microservice handlers are authenticated where they are wired.
    if (context.getType() !== 'http') return true;

    const route = getRoute(context);
    if (route ? route.auth === false : this.isPublic(context)) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = bearerToken(req) ?? readCookie(req, ACCESS_COOKIE);
    if (!token) throw new AppException(ErrorCode.UNAUTHORIZED);

    req.user = await this.verify(token);
    return true;
  }

  async verify(token: string): Promise<AuthUser> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch (error) {
      throw new AppException(
        error instanceof TokenExpiredError
          ? ErrorCode.AUTH_TOKEN_EXPIRED
          : ErrorCode.AUTH_TOKEN_INVALID,
        { cause: error },
      );
    }
  }

  private isPublic(context: ExecutionContext): boolean {
    return Boolean(
      Reflect.getMetadata(PUBLIC_KEY, context.getHandler()) ??
      Reflect.getMetadata(PUBLIC_KEY, context.getClass()),
    );
  }
}
