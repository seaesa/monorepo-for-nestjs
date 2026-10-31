import { Global, Module } from '@nestjs/common';

import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

/** Process metrics shared by the HTTP app and (potentially) the worker. */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
