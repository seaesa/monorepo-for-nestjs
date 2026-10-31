import {
  applyDecorators,
  createParamDecorator,
  type ExecutionContext,
  RequestMapping,
  RequestMethod,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';

import type { RouteDef } from '@repo/contracts';

import { validationException } from '../exceptions';

const ROUTE_METADATA = 'contract:route';

/**
 * Binds a controller method to a contract route: HTTP method + path,
 * auth requirement, body/query validation and response serialization.
 *
 * @example
 * @Endpoint(contract.auth.login)
 * login(@ReqBody() body: RouteBody<typeof contract.auth.login>) {}
 */
export function Endpoint(route: RouteDef): MethodDecorator {
  return applyDecorators(
    SetMetadata(ROUTE_METADATA, route),
    RequestMapping({ path: route.path, method: RequestMethod[route.method] }),
  );
}

export function getRoute(context: ExecutionContext): RouteDef | undefined {
  return Reflect.getMetadata(ROUTE_METADATA, context.getHandler()) as RouteDef | undefined;
}

function parseWith(schema: z.ZodType | undefined, value: unknown, label: string): unknown {
  if (!schema) throw new Error(`Route has no ${label} schema; add one to the contract.`);
  const result = schema.safeParse(value ?? {});
  if (!result.success) throw validationException(result.error);
  return result.data;
}

/** Request body parsed with the route's `body` schema. */
export const ReqBody = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return parseWith(getRoute(ctx)?.body, req.body, 'body');
});

/** Query string parsed with the route's `query` schema. */
export const ReqQuery = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return parseWith(getRoute(ctx)?.query, req.query, 'query');
});
