import { Injectable, type OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from '@prometheus-io/client';

/** Everything Prometheus scrapes for this process. */
@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'HTTP requests handled, by route and status.',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [this.registry],
  });

  readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP response time in seconds, by route and status.',
    labelNames: ['method', 'route', 'status'] as const,
    // Buckets tuned for an API: p95 work is normally well under a second.
    // oxlint-disable-next-line no-magic-numbers -- histogram bucket boundaries
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  onModuleInit(): void {
    // Event loop lag, heap, GC and open handles — free signal for capacity planning.
    collectDefaultMetrics({ register: this.registry });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
