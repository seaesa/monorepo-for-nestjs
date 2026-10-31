import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { csrfMiddleware } from './common/auth/csrf.middleware';
import { AppConfig } from './config/app-config.service';
import { mountApiDocs } from './infra/openapi/api-docs';

/** HTTP pipeline shared by `main.ts` and the e2e suite, so tests run what production runs. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfig);
  const origins = [...config.get('CORS_ORIGINS'), new URL(config.get('WEB_APP_URL')).origin];

  if (config.get('API_DOCS_ENABLED') ?? config.get('NODE_ENV') !== 'production') {
    mountApiDocs(app, config.get('APP_RELEASE') ?? 'dev');
  }
  app.use(helmet());
  app.use(cookieParser());
  app.use(csrfMiddleware(origins));
  app.enableCors({ origin: origins, credentials: true });
  app.set('trust proxy', 1);
}
