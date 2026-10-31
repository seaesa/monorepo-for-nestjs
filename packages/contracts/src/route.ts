import type { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * One REST endpoint. The backend binds it with `@Endpoint(route)`,
 * frontends call it with `request(route, input)` — both stay in sync by construction.
 */
export interface RouteDef<
  TMethod extends HttpMethod = HttpMethod,
  TPath extends string = string,
  TBody extends z.ZodType | undefined = z.ZodType | undefined,
  TQuery extends z.ZodType | undefined = z.ZodType | undefined,
  TResponse extends z.ZodType = z.ZodType,
> {
  method: TMethod;
  /** Express-style path, e.g. `/users/:id`. */
  path: TPath;
  body?: TBody;
  query?: TQuery;
  response: TResponse;
  /** Defaults to `true`. Public routes must opt out explicitly. */
  auth?: boolean;
}

export function defineRoute<
  const TMethod extends HttpMethod,
  const TPath extends string,
  TResponse extends z.ZodType,
  TBody extends z.ZodType | undefined = undefined,
  TQuery extends z.ZodType | undefined = undefined,
>(
  route: RouteDef<TMethod, TPath, TBody, TQuery, TResponse>,
): RouteDef<TMethod, TPath, TBody, TQuery, TResponse> {
  return route;
}

type ExtractParams<TPath extends string> = TPath extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractParams<`/${Rest}`>
  : TPath extends `${string}:${infer Param}`
    ? Param
    : never;

export type RouteParams<R extends RouteDef> = [ExtractParams<R['path']>] extends [never]
  ? never
  : Record<ExtractParams<R['path']>, string>;

type Field<TKey extends string, TValue, TOptional extends boolean = false> = [TValue] extends [
  never,
]
  ? {}
  : TOptional extends true
    ? { [K in TKey]?: TValue }
    : { [K in TKey]: TValue };

type SchemaInput<T> = T extends z.ZodType ? z.input<T> : never;
type SchemaOutput<T> = T extends z.ZodType ? z.output<T> : never;

/** What a caller must pass for a route: `{ params?, body?, query? }`, each only when the route has it. */
export type RouteInput<R extends RouteDef> = Field<'params', RouteParams<R>> &
  Field<'body', SchemaInput<R['body']>> &
  Field<'query', SchemaInput<R['query']>, true>;

/** Parsed (server-side) body / query types. */
export type RouteBody<R extends RouteDef> = SchemaOutput<R['body']>;
export type RouteQuery<R extends RouteDef> = SchemaOutput<R['query']>;
/** What a server handler may return before serialization (accepts `Date` for date fields). */
export type RouteResult<R extends RouteDef> = z.input<R['response']>;
/** The JSON shape a client receives. */
export type RouteResponse<R extends RouteDef> = z.output<R['response']>;

/** Fill `:params` into a route path. */
export function buildPath(path: string, params?: Record<string, string>): string {
  if (!params) return path;
  return path.replace(/:(\w+)/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined) throw new Error(`Missing path param "${key}" for ${path}`);
    return encodeURIComponent(value);
  });
}
