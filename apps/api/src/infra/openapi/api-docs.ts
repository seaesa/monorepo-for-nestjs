import type { NestExpressApplication } from '@nestjs/platform-express';
import { apiReference } from '@scalar/nestjs-api-reference';

import { buildOpenApiDocument } from './openapi.document';

const OPENAPI_PATH = '/openapi.json';
const DOCS_PATH = '/docs';

/** Mounted before helmet: the reference page loads its UI from Scalar's CDN. */
export function mountApiDocs(app: NestExpressApplication, version: string): void {
  const document = buildOpenApiDocument({ title: 'API', version });
  app.use(OPENAPI_PATH, (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json(document);
  });
  app.use(DOCS_PATH, apiReference({ url: OPENAPI_PATH }));
}
