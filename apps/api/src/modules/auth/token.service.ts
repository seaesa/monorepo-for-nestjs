import { randomBytes, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

import { type AuthTokens, ErrorCode, type Session } from '@repo/contracts';

import type { AccessTokenPayload, AuthUser, ClientInfo } from '../../common/auth';
import { AppException } from '../../common/exceptions';
import { MS_PER_SECOND, SECONDS_PER_DAY, SECONDS_PER_HOUR } from '../../common/time';
import { AppConfig } from '../../config/app-config.service';
import { InjectRedis } from '../../infra/redis/redis.module';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

interface SessionRecord {
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

const refreshKey = (userId: string, jti: string) => `auth:refresh:${userId}:${jti}`;
const sessionsKey = (userId: string) => `auth:sessions:${userId}`;
const passwordResetKey = (token: string) => `auth:password-reset:${token}`;
const emailVerificationKey = (token: string) => `auth:email-verification:${token}`;

const PASSWORD_RESET_TTL = SECONDS_PER_HOUR;
const EMAIL_VERIFICATION_TTL = SECONDS_PER_DAY;
/** 256 bits: unguessable for one-shot links. */
const ONE_SHOT_TOKEN_BYTES = 32;

/**
 * Stateless access tokens + rotating refresh tokens tracked in Redis.
 *
 * A refresh token works exactly once. Redis also keeps one hash per user listing
 * live sessions (id + device metadata) so the UI can show and revoke them.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async issue(user: AuthUser, meta?: ClientInfo): Promise<AuthTokens> {
    const jti = randomUUID();
    const accessTtl = this.config.get('JWT_ACCESS_TTL');
    const refreshTtl = this.config.get('JWT_REFRESH_TTL');
    const issuedAt = Date.now();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, email: user.email, role: user.role } satisfies AccessTokenPayload,
        {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: accessTtl,
        },
      ),
      this.jwt.signAsync({ sub: user.id, jti } satisfies RefreshTokenPayload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl,
      }),
    ]);

    const record: SessionRecord = {
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
      createdAt: new Date(issuedAt).toISOString(),
      expiresAt: new Date(issuedAt + refreshTtl * MS_PER_SECOND).toISOString(),
    };

    await this.redisCall(() =>
      this.redis
        .multi()
        .set(refreshKey(user.id, jti), user.email, 'EX', refreshTtl)
        .hset(sessionsKey(user.id), jti, JSON.stringify(record))
        .expire(sessionsKey(user.id), refreshTtl)
        .exec(),
    );

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  /** Validates and consumes a refresh token. Returns its owner. */
  async consume(refreshToken: string): Promise<{ id: string }> {
    const payload = await this.jwt
      .verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      })
      .catch((error: unknown) => {
        throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, { cause: error });
      });

    const email = await this.redisCall(() =>
      this.redis.getdel(refreshKey(payload.sub, payload.jti)),
    );
    if (!email) throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);

    // The rotation replaced this jti; the old row must not linger in the session list.
    await this.redisCall(() => this.redis.hdel(sessionsKey(payload.sub), payload.jti));
    return { id: payload.sub };
  }

  async listSessions(userId: string): Promise<Session[]> {
    const records = await this.redisCall(() => this.redis.hgetall(sessionsKey(userId)));
    return Object.entries(records)
      .map(([id, raw]) => {
        const record = JSON.parse(raw) as SessionRecord;
        return {
          id,
          userAgent: record.userAgent,
          ip: record.ip,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
        };
      })
      .filter((session) => new Date(session.expiresAt).getTime() > Date.now())
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async revokeSession(userId: string, jti: string): Promise<void> {
    const removed = await this.redisCall(() => this.redis.hdel(sessionsKey(userId), jti));
    await this.redisCall(() => this.redis.del(refreshKey(userId, jti)));
    if (removed === 0) throw new AppException(ErrorCode.AUTH_SESSION_NOT_FOUND);
  }

  async revokeAll(userId: string): Promise<void> {
    const jtis = await this.redisCall(() => this.redis.hkeys(sessionsKey(userId)));
    await this.redisCall(() =>
      this.redis
        .multi()
        .del(...jtis.map((jti) => refreshKey(userId, jti)), sessionsKey(userId))
        .exec(),
    );
  }

  /** One-shot, short-lived tokens for out-of-band flows. */
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = randomBytes(ONE_SHOT_TOKEN_BYTES).toString('base64url');
    await this.redisCall(() =>
      this.redis.set(passwordResetKey(token), userId, 'EX', PASSWORD_RESET_TTL),
    );
    return token;
  }

  async consumePasswordResetToken(token: string): Promise<string> {
    const userId = await this.redisCall(() => this.redis.getdel(passwordResetKey(token)));
    if (!userId) throw new AppException(ErrorCode.AUTH_RESET_TOKEN_INVALID);
    return userId;
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(ONE_SHOT_TOKEN_BYTES).toString('base64url');
    await this.redisCall(() =>
      this.redis.set(emailVerificationKey(token), userId, 'EX', EMAIL_VERIFICATION_TTL),
    );
    return token;
  }

  async consumeEmailVerificationToken(token: string): Promise<string> {
    const userId = await this.redisCall(() => this.redis.getdel(emailVerificationKey(token)));
    if (!userId) throw new AppException(ErrorCode.AUTH_VERIFICATION_TOKEN_INVALID);
    return userId;
  }

  private async redisCall<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppException) throw error;
      throw new AppException(ErrorCode.SERVICE_UNAVAILABLE, { cause: error });
    }
  }
}
