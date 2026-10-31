import { Injectable, Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

import { MS_PER_SECOND } from '../../common/time';
import { InjectRedis } from '../redis/redis.module';

type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

/** Rate-limit counters in Redis so limits hold across API instances. */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private warned = false;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      return await this.incrementInRedis(key, ttl, limit, blockDuration, throttlerName);
    } catch (error) {
      // Fail open. Rate limiting is a safety net, not a dependency: when Redis is
      // down the API must keep serving (the guard runs on *every* request, so a
      // throwing storage would take the whole service down with Redis).
      if (!this.warned) {
        this.warned = true;
        this.logger.warn({ err: error }, 'Rate limiter unavailable; allowing requests');
      }
      return { totalHits: 1, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
    }
  }

  private async incrementInRedis(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${hitKey}:blocked`;

    const blockedFor = await this.redis.pttl(blockKey);
    if (blockedFor > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockedFor / MS_PER_SECOND),
      };
    }

    const [[, totalHits], [, pttl]] = (await this.redis
      .multi()
      .incr(hitKey)
      .pttl(hitKey)
      .exec()) as [[null, number], [null, number]];
    if (pttl < 0) await this.redis.pexpire(hitKey, ttl);
    const timeToExpire = Math.ceil((pttl < 0 ? ttl : pttl) / MS_PER_SECOND);

    if (totalHits > limit) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration);
      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / MS_PER_SECOND),
      };
    }
    return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
  }
}
