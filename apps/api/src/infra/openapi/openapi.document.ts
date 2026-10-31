import { z } from 'zod';
import {
  createDocument,
  type ZodOpenApiObject,
  type ZodOpenApiOperationObject,
  type ZodOpenApiPathsObject,
} from 'zod-openapi';

import { apiErrorBodySchema, contract, type RouteDef } from '@repo/contracts';

import { ACCESS_COOKIE } from '../../common/auth';

type OpenApiDocument = ReturnType<typeof createDocument>;

const PATH_PARAM = /:(\w+)/g;
const errorResponse = {
  description: 'Error. Branch on `code`, never on the status or the message.',
  content: { 'application/json': { schema: apiErrorBodySchema } },
};

function operation(module: string, name: string, route: RouteDef): ZodOpenApiOperationObject {
  const params = [...route.path.matchAll(PATH_PARAM)].map(([, param]) => param);
  return {
    operationId: `${module}.${name}`,
    tags: [module],
    security: route.auth === false ? [] : undefined,
    requestParams: {
      ...(params.length && {
        path: z.object(Object.fromEntries(params.map((param) => [param, z.string()]))),
      }),
      ...(route.query && { query: route.query as z.ZodObject }),
    },
    requestBody: route.body && { content: { 'application/json': { schema: route.body } } },
    responses: {
      '2XX': {
        description: 'Success',
        content: { 'application/json': { schema: route.response } },
      },
      default: errorResponse,
    },
  };
}

/** OpenAPI 3.1 built from `contract`, so the published docs cannot drift from the API. */
export function buildOpenApiDocument(info: ZodOpenApiObject['info']): OpenApiDocument {
  const paths: ZodOpenApiPathsObject = {};
  for (const [module, routes] of Object.entries(contract)) {
    for (const [name, route] of Object.entries(routes as Record<string, RouteDef>)) {
      const path = route.path.replaceAll(PATH_PARAM, '{$1}');
      paths[path] = {
        ...paths[path],
        [route.method.toLowerCase()]: operation(module, name, route),
      };
    }
  }

  return createDocument({
    openapi: '3.1.0',
    info,
    paths,
    security: [{ bearer: [] }, { cookie: [] }],
    components: {
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer', description: 'Mobile and API clients.' },
        cookie: { type: 'apiKey', in: 'cookie', name: ACCESS_COOKIE, description: 'Web app.' },
      },
    },
  });
}
