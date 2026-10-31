import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';

import { AppConfig } from '../../config/app-config.service';

const RETRY_STEP_MS = 200;
const RETRY_MAX_MS = 2_000;
const READY_TIMEOUT_MS = 5_000;

export const REDIS = Symbol('REDIS');

/** Inject the shared ioredis client: `@InjectRedis() private readonly redis: Redis`. */
export const InjectRedis = () => Inject(REDIS);

/**
 * Shared, non-blocking Redis client.
 *
 * `maxRetriesPerRequest: null` and the default `enableOfflineQueue: true` are for
 * BullMQ's *blocking* connections. On a shared request-path client they turn a dead
 * Redis into an API-wide hang instead of a fast failure, so both are off here:
 * every command either gets an answer or rejects within `commandTimeout`.
 * BullMQ opens its own connections (`infra/queue/queue.module.ts`).
 */
function createRedisClient(url: string, logger: Logger): Redis {
  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    connectTimeout: 2_000,
    commandTimeout: 2_000,
    keepAlive: 10_000,
    retryStrategy: (attempt) => Math.min(attempt * RETRY_STEP_MS, RETRY_MAX_MS),
  });

  // Without a listener ioredis emits an unhandled `error` event and Node crashes.
  client.on('error', (error) => logger.warn({ err: error }, 'Redis client error'));
  client.on('reconnecting', () => logger.debug('Redis reconnecting'));

  return client;
}

/**
 * `enableOfflineQueue: false` means commands fail until the socket is ready, so a
 * request arriving in the first milliseconds after boot would see a spurious 503.
 * Wait for `ready` (or a failure/timeout) before handing the client to providers.
 * A dead Redis at boot is not fatal: the app still starts and fails fast per request.
 */
async function waitForReady(client: Redis, logger: Logger): Promise<Redis> {
  if (client.status === 'ready') return client;

  await new Promise<void>((resolve) => {
    const settle = (): void => {
      clearTimeout(timer);
      client.off('ready', settle);
      client.off('error', settle);
      resolve();
    };
    const timer = setTimeout(settle, READY_TIMEOUT_MS);
    if (timer.unref) timer.unref();

    client.once('ready', settle);
    client.once('error', () => {
      logger.warn('Redis is not reachable yet; serving requests without it until it recovers');
      settle();
    });
  });

  return client;
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [AppConfig],
      useFactory: async (config: AppConfig) => {
        const logger = new Logger('RedisModule');
        return waitForReady(createRedisClient(config.get('REDIS_URL'), logger), logger);
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    // `quit()` waits for the reply; `disconnect()` does not hang on a dead link.
    await this.redis.quit().catch(() => this.redis.disconnect());
  }
}
