import { Controller, HttpCode, HttpStatus, Param, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import {
  type AuthTokens,
  contract,
  ErrorCode,
  type RouteBody,
  type RouteResult,
} from '@repo/contracts';

import {
  type AuthUser,
  type ClientInfo,
  clearAuthCookies,
  CurrentUser,
  isCookieMode,
  readCookie,
  REFRESH_COOKIE,
  setAuthCookies,
} from '../../common/auth';
import { ClientMeta } from '../../common/auth/public.decorator';
import { Endpoint, ReqBody } from '../../common/contract';
import { AppException } from '../../common/exceptions';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { AppConfig } from '../../config/app-config.service';
import { perMinute, rateLimits } from '../../config/rate-limits';
import { AuthService } from './auth.service';

const r = contract.auth;

/**
 * Auth endpoints get their own, much tighter budget than the global 120/min:
 * each login attempt costs an argon2 verification, so the global limit both
 * fails to stop brute force and turns credential stuffing into a CPU attack.
 */
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfig,
  ) {}

  @Endpoint(r.register)
  @Throttle(perMinute(rateLimits.register))
  async register(
    @ReqBody() body: RouteBody<typeof r.register>,
    @ClientMeta() meta: ClientInfo,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RouteResult<typeof r.register>> {
    const { user, tokens } = await this.auth.register(body, meta);
    return { user, tokens: this.deliver(tokens, req, res) };
  }

  @Endpoint(r.login)
  @HttpCode(HttpStatus.OK)
  @Throttle(perMinute(rateLimits.login))
  async login(
    @ReqBody() body: RouteBody<typeof r.login>,
    @ClientMeta() meta: ClientInfo,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RouteResult<typeof r.login>> {
    const { user, tokens } = await this.auth.login(body, meta);
    return { user, tokens: this.deliver(tokens, req, res) };
  }

  @Endpoint(r.refresh)
  @HttpCode(HttpStatus.OK)
  @Throttle(perMinute(rateLimits.refresh))
  async refresh(
    @ReqBody() body: RouteBody<typeof r.refresh>,
    @ClientMeta() meta: ClientInfo,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RouteResult<typeof r.refresh>> {
    const refreshToken = body.refreshToken ?? readCookie(req, REFRESH_COOKIE);
    if (!refreshToken) throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
    const tokens = await this.auth.refresh(refreshToken, meta);
    return { tokens: this.deliver(tokens, req, res) };
  }

  @Endpoint(r.logout)
  @HttpCode(HttpStatus.OK)
  async logout(
    @ReqBody() body: RouteBody<typeof r.logout>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RouteResult<typeof r.logout>> {
    await this.auth.logout(body.refreshToken ?? readCookie(req, REFRESH_COOKIE));
    clearAuthCookies(res, this.cookieEnv());
    return { ok: true };
  }

  @Endpoint(r.logoutAll)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthUser): Promise<RouteResult<typeof r.logoutAll>> {
    await this.auth.logoutAll(user.id);
    return { ok: true };
  }

  @Endpoint(r.sessions)
  sessions(@CurrentUser() user: AuthUser): Promise<RouteResult<typeof r.sessions>> {
    return this.auth.sessions(user.id);
  }

  @Endpoint(r.revokeSession)
  async revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<RouteResult<typeof r.revokeSession>> {
    await this.auth.revokeSession(user.id, id);
    return { ok: true };
  }

  @Endpoint(r.forgotPassword)
  @HttpCode(HttpStatus.OK)
  @Throttle(perMinute(rateLimits.forgotPassword))
  async forgotPassword(
    @ReqBody() body: RouteBody<typeof r.forgotPassword>,
  ): Promise<RouteResult<typeof r.forgotPassword>> {
    await this.auth.forgotPassword(body);
    return { ok: true };
  }

  @Endpoint(r.resetPassword)
  @HttpCode(HttpStatus.OK)
  @Throttle(perMinute(rateLimits.resetPassword))
  async resetPassword(
    @ReqBody() body: RouteBody<typeof r.resetPassword>,
  ): Promise<RouteResult<typeof r.resetPassword>> {
    await this.auth.resetPassword(body);
    return { ok: true };
  }

  @Endpoint(r.verifyEmail)
  @HttpCode(HttpStatus.OK)
  @Throttle(perMinute(rateLimits.verifyEmail))
  async verifyEmail(
    @ReqBody() body: RouteBody<typeof r.verifyEmail>,
  ): Promise<RouteResult<typeof r.verifyEmail>> {
    await this.auth.verifyEmail(body);
    return { ok: true };
  }

  @Endpoint(r.resendVerification)
  @HttpCode(HttpStatus.OK)
  @Throttle(perMinute(rateLimits.resendVerification))
  async resendVerification(
    @ReqBody() body: RouteBody<typeof r.resendVerification>,
  ): Promise<RouteResult<typeof r.resendVerification>> {
    await this.auth.resendVerification(body);
    return { ok: true };
  }

  @Endpoint(r.me)
  me(@CurrentUser() user: AuthUser): Promise<RouteResult<typeof r.me>> {
    return this.auth.me(user.id);
  }

  @Endpoint(r.updateMe)
  updateMe(
    @CurrentUser() user: AuthUser,
    @ReqBody() body: RouteBody<typeof r.updateMe>,
  ): Promise<RouteResult<typeof r.updateMe>> {
    return this.auth.updateMe(user.id, body);
  }

  /** Cookie mode (web): tokens go to httpOnly cookies and never reach JavaScript. */
  private deliver(tokens: AuthTokens, req: Request, res: Response): AuthTokens | undefined {
    if (!isCookieMode(req)) return tokens;
    setAuthCookies(res, tokens, this.cookieEnv());
    return undefined;
  }

  private cookieEnv() {
    return {
      NODE_ENV: this.config.get('NODE_ENV'),
      COOKIE_DOMAIN: this.config.get('COOKIE_DOMAIN'),
      JWT_REFRESH_TTL: this.config.get('JWT_REFRESH_TTL'),
    };
  }
}
