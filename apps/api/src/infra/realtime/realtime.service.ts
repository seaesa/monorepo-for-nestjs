import { Injectable, Logger } from '@nestjs/common';
import { Emitter } from '@socket.io/redis-emitter';
import Redis from 'ioredis';

import { type ServerToClientEvents, socketRooms } from '@repo/contracts';

import { InjectRedis } from '../redis/redis.module';

/**
 * Push events to connected clients from anywhere — API instances and workers alike.
 * Publishes through Redis, so every API node's socket.io server (redis adapter) delivers it.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly emitter: Emitter<ServerToClientEvents>;

  constructor(@InjectRedis() redis: Redis) {
    this.emitter = new Emitter<ServerToClientEvents>(redis);
  }

  toUser<E extends keyof ServerToClientEvents>(
    userId: string,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void {
    try {
      this.emitter.to(socketRooms.user(userId)).emit(event, ...args);
    } catch (error) {
      // Realtime is best-effort: a Redis hiccup must never fail the HTTP request that
      // produced the event. The client refetches on reconnect anyway.
      this.logger.warn(`Dropped ${event} for ${userId}: ${String(error)}`);
    }
  }
}
