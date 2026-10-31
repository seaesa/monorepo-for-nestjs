import { Controller, Inject, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  type HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import Redis from 'ioredis';

import { contract } from '@repo/contracts';

import { Endpoint } from '../../common/contract';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { REDIS } from '../../infra/redis/redis.module';

/**
 * How long a single dependency may take before we call it down. Without this a hung
 * connection (e.g. Postgres with a saturated pool) would hang the probe itself, and the
 * orchestrator would never learn the pod is unhealthy.
 */
const PROBE_TIMEOUT_MS = 3_000;

const route = contract.health.check;

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Endpoint(route)
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.probe('database', () => this.prisma.$queryRaw`SELECT 1`),
      () => this.probe('redis', () => this.redis.ping()),
    ]);
  }

  private async probe(key: string, fn: () => Promise<unknown>): Promise<HealthIndicatorResult> {
    const indicator = this.indicator.check(key);
    try {
      await withTimeout(fn(), PROBE_TIMEOUT_MS);
      return indicator.up();
    } catch (error) {
      // Log the real reason, expose only a stable marker: /health is public and provider
      // errors tend to carry hosts, ports and credentials.
      this.logger.warn(`${key} probe failed: ${String(error)}`);
      return indicator.down({ message: 'unreachable' });
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
