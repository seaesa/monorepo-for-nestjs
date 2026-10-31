import { Logger } from '@nestjs/common';
import { type OnGatewayConnection, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { parseCookie } from 'cookie';
import type { Socket } from 'socket.io';

import { type ClientToServerEvents, type ServerToClientEvents, socketRooms } from '@repo/contracts';

import { ACCESS_COOKIE, AuthGuard } from '../../common/auth';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Authenticates sockets with the access token (handshake `auth.token` on mobile, the httpOnly
 * cookie on web) and joins them to their user room.
 *
 * CORS is applied by `RedisIoAdapter` from the same `CORS_ORIGINS` allow-list as HTTP,
 * so the two transports cannot drift apart.
 */
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly auth: AuthGuard) {}

  async handleConnection(socket: AppSocket): Promise<void> {
    try {
      const token =
        (socket.handshake.auth as { token?: string }).token ??
        parseCookie(socket.handshake.headers.cookie ?? '')[ACCESS_COOKIE];
      if (!token) throw new Error('missing token');
      const user = await this.auth.verify(token);
      socket.data.userId = user.id;
      await socket.join(socketRooms.user(user.id));
    } catch {
      this.logger.debug(`Rejected socket ${socket.id}`);
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('ping')
  ping(): { pong: true; at: string } {
    return { pong: true, at: new Date().toISOString() };
  }
}
