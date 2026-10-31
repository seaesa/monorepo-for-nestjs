import { Global, Module } from '@nestjs/common';

import { RealtimeService } from './realtime.service';

/** `RealtimeService` only — usable by the API and the worker. The gateway lives in AppModule. */
@Global()
@Module({ providers: [RealtimeService], exports: [RealtimeService] })
export class RealtimeModule {}
