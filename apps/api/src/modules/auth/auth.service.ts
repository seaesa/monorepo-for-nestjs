import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import {
  type AuthTokens,
  contract,
  defaultLocale,
  ErrorCode,
  type RouteBody,
  type Session,
} from '@repo/contracts';

import type { ClientInfo } from '../../common/auth';
import { AppException } from '../../common/exceptions';
import { AppConfig } from '../../config/app-config.service';
import { Prisma, type User } from '../../generated/prisma/client';
import type { MailRecipient } from '../../infra/queue/queues';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';

/** Tokens always present here; the controller decides whether they go in cookies or the body. */
type SessionResult = { user: User; tokens: AuthTokens };

/**
 * A fixed-cost hash check for unknown emails. Without it, `login` returns
 * noticeably faster for addresses that do not exist (argon2 is the expensive
 * part), which lets an attacker enumerate accounts.
 */
const DUMMY_PASSWORD_BYTES = 16;
let dummyHash: Promise<string> | undefined;
const unknownUserHash = () =>
  (dummyHash ??= argon2.hash(randomBytes(DUMMY_PASSWORD_BYTES).toString('hex')));

function recipient(user: User): MailRecipient {
  return { userId: user.id, email: user.email, name: user.name, locale: user.locale };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly config: AppConfig,
  ) {}

  async register(
    input: RouteBody<typeof contract.auth.register>,
    meta: ClientInfo,
  ): Promise<SessionResult> {
    // Friendly fast path; the unique index is the real guard.
    if (await this.users.findByEmail(input.email)) {
      throw new AppException(ErrorCode.AUTH_EMAIL_TAKEN, { field: 'email' });
    }

    const passwordHash = await argon2.hash(input.password);
    let user: User;
    try {
      user = await this.users.create({
        email: input.email,
        name: input.name,
        passwordHash,
        locale: input.locale ?? defaultLocale,
      });
    } catch (error) {
      // Two concurrent registrations: the loser hits the unique index, not the check above.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppException(ErrorCode.AUTH_EMAIL_TAKEN, { field: 'email', cause: error });
      }
      throw error;
    }

    // Enqueue only after the row is committed, and never let the queue fail the request.
    this.mail.enqueue(() => this.mail.sendWelcome(recipient(user)), 'welcome');

    if (this.config.get('REQUIRE_EMAIL_VERIFICATION')) {
      this.sendVerificationEmail(user);
      // No session yet: handing out tokens here would make the verification gate pointless.
      throw new AppException(ErrorCode.AUTH_EMAIL_NOT_VERIFIED, { field: 'email' });
    }

    return this.session(user, meta);
  }

  async login(
    input: RouteBody<typeof contract.auth.login>,
    meta: ClientInfo,
  ): Promise<SessionResult> {
    const user = await this.users.findByEmail(input.email);
    const hash = user?.passwordHash ?? (await unknownUserHash());
    const valid = await argon2.verify(hash, input.password).catch(() => false);
    if (!user || !valid) throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS);

    if (this.config.get('REQUIRE_EMAIL_VERIFICATION') && !user.emailVerifiedAt) {
      throw new AppException(ErrorCode.AUTH_EMAIL_NOT_VERIFIED, { field: 'email' });
    }
    // Signing in from an app in another language moves emails and pushes to that language.
    const current =
      input.locale && input.locale !== user.locale
        ? await this.users.update(user.id, { locale: input.locale })
        : user;
    return this.session(current, meta);
  }

  async refresh(refreshToken: string, meta: ClientInfo): Promise<AuthTokens> {
    const { id } = await this.tokens.consume(refreshToken);
    // Re-read the account: a role change or deletion takes effect at the next refresh.
    const user = await this.users.findById(id);
    if (!user) throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
    return this.tokens.issue(user, meta);
  }

  /** Public on purpose: the refresh token is the credential being revoked. */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.tokens.consume(refreshToken).catch(() => undefined);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokens.revokeAll(userId);
  }

  async sessions(userId: string): Promise<{ items: Session[] }> {
    return { items: await this.tokens.listSessions(userId) };
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.tokens.revokeSession(userId, sessionId);
  }

  /**
   * Always resolves. Telling the caller whether the address exists would turn this
   * endpoint into an account-enumeration oracle.
   */
  async forgotPassword(input: RouteBody<typeof contract.auth.forgotPassword>): Promise<void> {
    const user = await this.users.findByEmail(input.email);
    if (!user) return;

    const token = await this.tokens.createPasswordResetToken(user.id);
    this.mail.enqueue(
      () => this.mail.sendPasswordReset({ ...recipient(user), token }),
      'password reset',
    );
  }

  async resetPassword(input: RouteBody<typeof contract.auth.resetPassword>): Promise<void> {
    const userId = await this.tokens.consumePasswordResetToken(input.token);
    await this.users.updatePasswordHash(userId, await argon2.hash(input.password));
    // A password change invalidates every device, including any attacker's session.
    await this.tokens.revokeAll(userId);
  }

  async verifyEmail(input: RouteBody<typeof contract.auth.verifyEmail>): Promise<void> {
    const userId = await this.tokens.consumeEmailVerificationToken(input.token);
    await this.users.markEmailVerified(userId);
  }

  /**
   * Always resolves, for the same reason as `forgotPassword`: a user blocked by the
   * verification gate has no access token, so the address in the body is all we have —
   * and answering honestly would leak who has an account.
   */
  async resendVerification(
    input: RouteBody<typeof contract.auth.resendVerification>,
  ): Promise<void> {
    const user = await this.users.findByEmail(input.email);
    if (!user || user.emailVerifiedAt) return;
    this.sendVerificationEmail(user);
  }

  async me(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new AppException(ErrorCode.UNAUTHORIZED);
    return user;
  }

  updateMe(userId: string, input: RouteBody<typeof contract.auth.updateMe>): Promise<User> {
    return this.users.update(userId, input);
  }

  private sendVerificationEmail(user: User): void {
    this.mail.enqueue(async () => {
      const token = await this.tokens.createEmailVerificationToken(user.id);
      await this.mail.sendEmailVerification({ ...recipient(user), token });
    }, 'email verification');
  }

  private async session(user: User, meta: ClientInfo): Promise<SessionResult> {
    return { user, tokens: await this.tokens.issue(user, meta) };
  }
}
