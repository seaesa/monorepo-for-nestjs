import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { AppConfig } from '../../config/app-config.service';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * `connection_limit` is per process: sum over all API + worker replicas must stay
 * under Postgres `max_connections`. The default (10 per process) is far too low for
 * a Nest API under load, and unbounded pooling exhausts Postgres when you scale out.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: AppConfig) {
    const connectionString = config.get('DATABASE_URL');
    const max = config.get('DATABASE_POOL_SIZE');

    super({
      adapter: new PrismaPg({
        connectionString,
        max,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
