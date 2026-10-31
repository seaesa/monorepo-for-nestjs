import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';

import { AppConfig } from '../../config/app-config.service';
import type { PrismaTx } from '../prisma/transaction';

export interface PushMessage {
  title: string;
  body: string;
  /** Read by the app when the user taps the notification, e.g. `{ url: '/tasks/<id>' }`. */
  data?: Record<string, unknown>;
}

/** Sends Expo push notifications to every device a user is signed in on. */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo: Expo;

  constructor(
    private readonly db: TransactionHost<PrismaTx>,
    config: AppConfig,
  ) {
    this.expo = new Expo({ accessToken: config.get('EXPO_ACCESS_TOKEN') });
  }

  async toUser(userId: string, message: PushMessage): Promise<void> {
    const devices = await this.db.tx.device.findMany({
      where: { userId },
      select: { token: true },
    });
    const tokens = devices
      .map((device) => device.token)
      .filter((token) => Expo.isExpoPushToken(token));
    if (tokens.length === 0) return;

    const { title, body, data } = message;
    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data,
    }));
    const chunks = this.expo.chunkPushNotifications(messages);
    const results = await Promise.all(
      chunks.map((chunk) => this.expo.sendPushNotificationsAsync(chunk)),
    );
    const stale: string[] = [];
    results.forEach((tickets, chunkIndex) => {
      const chunk = chunks[chunkIndex] ?? [];
      tickets.forEach((ticket: ExpoPushTicket, index) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          stale.push(String(chunk[index]?.to));
        } else if (ticket.status === 'error') {
          this.logger.warn(`Push to ${userId} failed: ${ticket.message}`);
        }
      });
    });
    // The app was uninstalled or the token rotated: stop sending to it.
    if (stale.length > 0) await this.db.tx.device.deleteMany({ where: { token: { in: stale } } });
  }
}
