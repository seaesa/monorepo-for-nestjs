import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';

import { AppConfig } from '../config/app-config.service';
import { AppConfigModule } from '../config/config.module';
import { clsModule } from './cls';
import { loggerOptions } from './logger';
import { PrismaModule } from './prisma/prisma.module';
import { PushModule } from './push/push.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RedisModule } from './redis/redis.module';

/** Cross-cutting infrastructure shared by the API and the worker process. */
@Module({
  imports: [
    AppConfigModule,
    SentryModule.forRoot(),
    LoggerModule.forRootAsync({ inject: [AppConfig], useFactory: loggerOptions }),
    PrismaModule,
    clsModule,
    RedisModule,
    QueueModule,
    RealtimeModule,
    PushModule,
  ],
})
export class InfraModule {}
