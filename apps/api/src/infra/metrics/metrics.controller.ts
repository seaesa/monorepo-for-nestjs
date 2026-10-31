import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

import { ErrorCode } from '@repo/contracts';

import { Public } from '../../common/auth/public.decorator';
import { AppException } from '../../common/exceptions';
import { AppConfig } from '../../config/app-config.service';
import { MetricsService } from './metrics.service';

/**
 * Prometheus scrape endpoint. Deliberately outside the contract: its payload is text, not
 * JSON, and it must stay reachable without a token.
 */
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly config: AppConfig,
  ) {}

  @Public()
  @Get()
  async scrape(@Res() response: Response): Promise<void> {
    if (!this.config.get('METRICS_ENABLED')) throw new AppException(ErrorCode.NOT_FOUND);
    const body = await this.metrics.metrics();
    response.setHeader('Content-Type', this.metrics.contentType).send(body);
  }
}
