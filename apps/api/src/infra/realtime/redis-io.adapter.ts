import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type Redis from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

import { REDIS } from '../redis/redis.module';

/**
 * socket.io adapter backed by Redis pub/sub so rooms work across API instances.
 *
 * Also owns the WebSocket CORS policy: it reuses the HTTP allow-list so a browser origin
 * allowed to call the API is exactly the set allowed to open a socket.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly pub: Redis;
  private readonly sub: Redis;

  constructor(
    app: INestApplicationContext,
    private readonly origins: string[] = [],
  ) {
    super(app);
    const redis = app.get<Redis>(REDIS);
    // The shared client fails fast (`enableOfflineQueue: false`) because requests must not queue
    // behind a dead Redis. The pub/sub pair is the opposite case: it lives for the process
    // lifetime and must buffer `subscribe`/`publish` until the connection is ready, so it gets
    // its own options instead of inheriting the request-path ones.
    const pubSubOptions = { enableOfflineQueue: true, maxRetriesPerRequest: null } as const;
    this.pub = redis.duplicate(pubSubOptions);
    this.sub = redis.duplicate(pubSubOptions);
  }

  override createIOServer(port: number, options?: Partial<ServerOptions>): Server {
    // `ServerOptions` marks `path` as required while socket.io accepts a partial here;
    // the cast keeps Nest's signature happy without inventing a parallel options type.
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
    } as ServerOptions);
    server.adapter(createAdapter(this.pub, this.sub));
    return server;
  }

  override async dispose(): Promise<void> {
    await super.dispose();
    await Promise.allSettled([this.pub.quit(), this.sub.quit()]);
  }
}
