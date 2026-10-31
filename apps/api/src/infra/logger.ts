import type { IncomingMessage } from 'node:http';

import type { Params } from 'nestjs-pino';

import type { AppConfig } from '../config/app-config.service';

export function loggerOptions(config: AppConfig): Params {
  return {
    pinoHttp: {
      level: config.get('LOG_LEVEL'),
      transport: config.isProduction
        ? undefined
        : { target: 'pino-pretty', options: { singleLine: true } },
      genReqId: (req: IncomingMessage) =>
        (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID(),
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      customProps: (req) => ({ userId: (req as { user?: { id: string } }).user?.id }),
      autoLogging: { ignore: (req) => req.url === '/health' },
    },
  };
}
