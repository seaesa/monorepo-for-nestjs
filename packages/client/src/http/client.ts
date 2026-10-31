import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { StateStorage } from 'zustand/middleware';

import {
  AUTH_MODE_COOKIE,
  AUTH_MODE_HEADER,
  buildPath,
  contract,
  ErrorCode,
  type RouteDef,
  type RouteInput,
  type RouteResponse,
} from '@repo/contracts';

import { tokenStorage } from '../session/token-storage';
import { ApiError, toApiError } from './api-error';

/**
 * - `cookie` (web): the API keeps tokens in httpOnly cookies; JS never sees them.
 * - `bearer` (mobile): tokens come back in the body and live in `tokenStorage` (SecureStore).
 */
export type AuthMode = { mode: 'cookie' } | { mode: 'bearer'; tokenStorage: StateStorage };

export interface ClientConfig {
  /** REST base URL, e.g. `http://localhost:3000`. */
  apiUrl: string;
  auth: AuthMode;
  /** Called when the session can no longer be refreshed (e.g. redirect to sign-in). */
  onSessionExpired?: () => void;
}

let config: ClientConfig | undefined;
let http: AxiosInstance | undefined;
/** Same defaults, no interceptors: refresh must not send a stale bearer or recurse. */
let bare: AxiosInstance | undefined;
let refreshing: Promise<boolean> | null = null;

/** Call once at app start, before rendering. */
export function configureClient(next: ClientConfig): void {
  config = next;
  const cookieMode = next.auth.mode === 'cookie';
  const defaults = {
    baseURL: next.apiUrl,
    timeout: 15_000,
    withCredentials: cookieMode,
    headers: cookieMode ? { [AUTH_MODE_HEADER]: AUTH_MODE_COOKIE } : {},
  };
  http = axios.create(defaults);
  bare = axios.create(defaults);

  http.interceptors.request.use((req) => {
    const token = tokenStorage.get()?.accessToken;
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  http.interceptors.response.use(undefined, async (error: unknown) => {
    const apiError = toApiError(error);
    const original = axios.isAxiosError(error)
      ? (error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined)
      : undefined;

    if (apiError.is(ErrorCode.AUTH_TOKEN_EXPIRED) && original && !original._retry) {
      original._retry = true;
      if (await refreshSession()) return getHttp()(original);
    }
    throw apiError;
  });
}

export function getClientConfig(): ClientConfig {
  if (!config) throw new Error('@repo/client: call configureClient() before using the API.');
  return config;
}

/** The configured axios instance — for the rare call that is not in the contract (uploads...). */
export function getHttp(): AxiosInstance {
  if (!http) getClientConfig();
  return http!;
}

/** Single-flight refresh: concurrent 401s share one refresh request. */
function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const { auth, onSessionExpired } = getClientConfig();
    const route = contract.auth.refresh;
    try {
      const refreshToken = tokenStorage.get()?.refreshToken;
      if (auth.mode === 'bearer' && !refreshToken) throw new Error('no refresh token');
      const { data } = await bare!.post(route.path, auth.mode === 'bearer' ? { refreshToken } : {});
      const { tokens } = route.response.parse(data);
      if (tokens) await tokenStorage.set(tokens);
      return true;
    } catch {
      await tokenStorage.clear();
      onSessionExpired?.();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type InputArgs<R extends RouteDef> =
  {} extends RouteInput<R> ? [input?: RouteInput<R>] : [input: RouteInput<R>];

/**
 * Typed call to any contract route. Rejects with `ApiError`.
 * @example const user = await request(contract.auth.me);
 */
export async function request<R extends RouteDef>(
  route: R,
  ...[input]: InputArgs<R>
): Promise<RouteResponse<R>> {
  const { params, body, query } = (input ?? {}) as {
    params?: Record<string, string>;
    body?: unknown;
    query?: unknown;
  };
  try {
    const { data } = await getHttp().request({
      method: route.method,
      url: buildPath(route.path, params),
      data: body,
      params: query,
    });
    return data as RouteResponse<R>;
  } catch (error) {
    throw error instanceof ApiError ? error : toApiError(error);
  }
}
