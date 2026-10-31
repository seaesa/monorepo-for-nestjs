import * as argon2 from 'argon2';

import { ErrorCode } from '@repo/contracts';

import type { ClientInfo } from '../../common/auth';
import { AppException } from '../../common/exceptions';
import type { AppConfig } from '../../config/app-config.service';
import { Prisma, type User } from '../../generated/prisma/client';
import type { MailService } from '../mail/mail.service';
import type { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { TokenService } from './token.service';

/**
 * A Prisma unique-constraint failure without guessing the constructor shape.
 * `instanceof` still holds, which is what the service checks.
 */
function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
    code,
    message: `Prisma error ${code}`,
    clientVersion: '7.10.1',
  }) as Prisma.PrismaClientKnownRequestError;
}

const meta: ClientInfo = { userAgent: 'jest', ip: '127.0.0.1' };
const user: User = {
  id: '01a18d8e-f5ee-750a-8435-ff37b694f9f9',
  email: 'ada@example.com',
  name: 'Ada',
  passwordHash: '',
  locale: 'en',
  role: 'USER',
  emailVerifiedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};
const tokens = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 };

describe('AuthService', () => {
  const users = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePasswordHash: jest.fn(),
    markEmailVerified: jest.fn(),
  };
  const tokenService = {
    issue: jest.fn(),
    consume: jest.fn(),
    revokeAll: jest.fn(),
    listSessions: jest.fn(),
    revokeSession: jest.fn(),
    createPasswordResetToken: jest.fn(),
    consumePasswordResetToken: jest.fn(),
    createEmailVerificationToken: jest.fn(),
    consumeEmailVerificationToken: jest.fn(),
  };
  const mail = {
    enqueue: jest.fn(),
    sendWelcome: jest.fn(),
    sendPasswordReset: jest.fn(),
    sendEmailVerification: jest.fn(),
  };
  const config = { get: jest.fn() };

  const service = new AuthService(
    users as unknown as UsersService,
    tokenService as unknown as TokenService,
    mail as unknown as MailService,
    config as unknown as AppConfig,
  );

  const registerInput = { email: 'ada@example.com', name: 'Ada', password: 'Password1' };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue(false);
    tokenService.issue.mockResolvedValue(tokens);
  });

  describe('register', () => {
    it('creates the user and returns a session', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue(user);

      await expect(service.register(registerInput, meta)).resolves.toEqual({ user, tokens });
      expect(mail.enqueue).toHaveBeenCalledWith(expect.any(Function), 'welcome');
    });

    it('binds AUTH_EMAIL_TAKEN to the email field on the friendly path', async () => {
      users.findByEmail.mockResolvedValue(user);

      const error = await service.register(registerInput, meta).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).code).toBe(ErrorCode.AUTH_EMAIL_TAKEN);
      expect((error as AppException).fieldErrors?.[0]?.path).toBe('email');
    });

    it('binds the same code and field when two requests race on the unique index', async () => {
      // The pre-check passes for both requests; the loser gets P2002 from Postgres.
      users.findByEmail.mockResolvedValue(null);
      users.create.mockRejectedValue(prismaError('P2002'));

      const error = await service.register(registerInput, meta).catch((e: unknown) => e);
      expect((error as AppException).code).toBe(ErrorCode.AUTH_EMAIL_TAKEN);
      expect((error as AppException).fieldErrors?.[0]?.path).toBe('email');
    });

    it('refuses to hand out a session when verification is required', async () => {
      config.get.mockReturnValue(true);
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue(user);

      const error = await service.register(registerInput, meta).catch((e: unknown) => e);
      expect((error as AppException).code).toBe(ErrorCode.AUTH_EMAIL_NOT_VERIFIED);
      // The row is committed: the user can resend the link instead of re-registering.
      expect(users.create).toHaveBeenCalled();
      expect(mail.enqueue).toHaveBeenCalledWith(expect.any(Function), 'email verification');
    });
  });

  describe('login', () => {
    it('rejects an unknown email after doing the same hashing work', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'Password1' }, meta),
      ).rejects.toMatchObject({ code: ErrorCode.AUTH_INVALID_CREDENTIALS });
    });

    it('rejects a wrong password', async () => {
      users.findByEmail.mockResolvedValue({ ...user, passwordHash: await argon2.hash('Other123') });

      await expect(
        service.login({ email: user.email, password: 'Password1' }, meta),
      ).rejects.toMatchObject({ code: ErrorCode.AUTH_INVALID_CREDENTIALS });
    });

    it('accepts valid credentials', async () => {
      users.findByEmail.mockResolvedValue({
        ...user,
        passwordHash: await argon2.hash('Password1'),
      });

      await expect(
        service.login({ email: user.email, password: 'Password1' }, meta),
      ).resolves.toMatchObject({ tokens: { accessToken: tokens.accessToken } });
      expect(users.update).not.toHaveBeenCalled();
    });

    it('moves the account to the language of the app the user signs in from', async () => {
      const stored = { ...user, passwordHash: await argon2.hash('Password1') };
      users.findByEmail.mockResolvedValue(stored);
      users.update.mockResolvedValue({ ...stored, locale: 'vi' });

      await expect(
        service.login({ email: user.email, password: 'Password1', locale: 'vi' }, meta),
      ).resolves.toMatchObject({ user: { locale: 'vi' } });
      expect(users.update).toHaveBeenCalledWith(user.id, { locale: 'vi' });
    });

    it('blocks unverified accounts only when the flag is on', async () => {
      users.findByEmail.mockResolvedValue({
        ...user,
        passwordHash: await argon2.hash('Password1'),
      });

      config.get.mockReturnValue(true);
      await expect(
        service.login({ email: user.email, password: 'Password1' }, meta),
      ).rejects.toMatchObject({ code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED });

      config.get.mockReturnValue(false);
      await expect(
        service.login({ email: user.email, password: 'Password1' }, meta),
      ).resolves.toMatchObject({ user: { id: user.id } });
    });
  });

  describe('password reset', () => {
    it('stays silent for unknown addresses so the endpoint is not an oracle', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword({ email: 'ghost@example.com' })).resolves.toBeUndefined();
      expect(mail.enqueue).not.toHaveBeenCalled();
    });

    it('emails a reset token to a real account', async () => {
      users.findByEmail.mockResolvedValue(user);
      tokenService.createPasswordResetToken.mockResolvedValue('reset-token');

      await service.forgotPassword({ email: user.email });
      expect(mail.enqueue).toHaveBeenCalledWith(expect.any(Function), 'password reset');
    });

    it('revokes every session after a successful reset', async () => {
      tokenService.consumePasswordResetToken.mockResolvedValue(user.id);

      await service.resetPassword({ token: 'reset-token', password: 'NewPassword1' });

      expect(users.updatePasswordHash).toHaveBeenCalledWith(user.id, expect.any(String));
      expect(tokenService.revokeAll).toHaveBeenCalledWith(user.id);
    });

    it('does not touch the account when the token is invalid', async () => {
      tokenService.consumePasswordResetToken.mockRejectedValue(
        new AppException(ErrorCode.AUTH_RESET_TOKEN_INVALID),
      );

      await expect(
        service.resetPassword({ token: 'bad', password: 'NewPassword1' }),
      ).rejects.toMatchObject({ code: ErrorCode.AUTH_RESET_TOKEN_INVALID });
      expect(users.updatePasswordHash).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the refresh token without needing an access token', async () => {
      tokenService.consume.mockResolvedValue({ id: user.id, email: user.email });

      await service.logout('refresh-token');
      expect(tokenService.consume).toHaveBeenCalledWith('refresh-token');
    });

    it('never fails when the token is already gone', async () => {
      tokenService.consume.mockRejectedValue(new AppException(ErrorCode.AUTH_TOKEN_INVALID));
      await expect(service.logout('stale')).resolves.toBeUndefined();
    });
  });

  it('marks an email verified when the token is valid', async () => {
    tokenService.consumeEmailVerificationToken.mockResolvedValue(user.id);

    await service.verifyEmail({ token: 'verify-token' });
    expect(users.markEmailVerified).toHaveBeenCalledWith(user.id);
  });

  it('resends verification only for unverified accounts', async () => {
    users.findByEmail.mockResolvedValue({ ...user, emailVerifiedAt: new Date() });

    await service.resendVerification({ email: user.email });
    expect(mail.enqueue).not.toHaveBeenCalled();
  });
});
