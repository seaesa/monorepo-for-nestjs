import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import type { RegisterDeviceInput } from '@repo/contracts';

import type { PrismaTx } from '../../infra/prisma/transaction';

@Injectable()
export class DevicesService {
  constructor(private readonly db: TransactionHost<PrismaTx>) {}

  /** A token belongs to whoever registered it last (shared phone, account switch). */
  async register(userId: string, { token, platform }: RegisterDeviceInput): Promise<void> {
    await this.db.tx.device.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  async unregister(userId: string, token: string): Promise<void> {
    await this.db.tx.device.deleteMany({ where: { userId, token } });
  }
}
