import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

import { AppConfig } from '../../config/app-config.service';
import { QueueName } from './queues';

const queues = Object.values(QueueName).map((name) => BullModule.registerQueue({ name }));

/** Registers the BullMQ connection and every queue (producers can inject any queue). */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        connection: { url: config.get('REDIS_URL') },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1_000 },
          removeOnComplete: 1_000,
          removeOnFail: 5_000,
        },
      }),
    }),
    ...queues,
  ],
  exports: queues,
})
export class QueueModule {}
