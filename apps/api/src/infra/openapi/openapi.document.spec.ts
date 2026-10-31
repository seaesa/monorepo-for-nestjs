import { contract } from '@repo/contracts';

import { buildOpenApiDocument } from './openapi.document';

describe('buildOpenApiDocument', () => {
  it('documents every contract route, with public routes marked as such', () => {
    const document = buildOpenApiDocument({ title: 'API', version: 'test' });
    const routes = Object.values(contract).flatMap((group) => Object.values(group));

    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item as Record<string, { operationId?: string }>),
    );
    expect(operations).toHaveLength(routes.length);
    expect(document.paths?.['/auth/login']?.post?.security).toEqual([]);
    expect(document.paths?.['/tasks/{id}']?.get?.security).toBeUndefined();
  });
});
