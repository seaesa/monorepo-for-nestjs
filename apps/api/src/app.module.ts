import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import type Redis from 'ioredis';

import { AuthGuard } from './common/auth';
import { ContractSerializerInterceptor } from './common/contract';
import { AllExceptionsFilter } from './common/exceptions';
import { globalThrottler } from './config/rate-limits';
import { InfraModule } from './infra/infra.module';
import { MetricsInterceptor } from './infra/metrics/metrics.interceptor';
import { MetricsModule } from './infra/metrics/metrics.module';
import { RealtimeGateway } from './infra/realtime/realtime.gateway';
import { REDIS } from './infra/redis/redis.module';
import { HttpThrottlerGuard } from './infra/throttler/http-throttler.guard';
import { RedisThrottlerStorage } from './infra/throttler/redis-throttler.storage';
import { AuthModule } from './modules/auth/auth.module';
import { DevicesModule } from './modules/devices/devices.module';
import { HealthModule } from './modules/health/health.module';
import { TasksModule } from './modules/tasks/tasks.module';

/** HTTP + WebSocket application. Background jobs live in WorkerModule. */
@Module({
  imports: [
    InfraModule,
    MetricsModule,
    JwtModule.register({ global: true }),
    ThrottlerModule.forRootAsync({
      inject: [REDIS],
      useFactory: (redis: Redis) => ({
        throttlers: [globalThrottler],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    HealthModule,
    AuthModule,
    TasksModule,
    DevicesModule,
  ],
  providers: [
    AuthGuard,
    RealtimeGateway,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: HttpThrottlerGuard },
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ContractSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
