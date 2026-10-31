// http
export { ApiError, toApiError } from './http/api-error';
export { configureClient, getHttp, request, type AuthMode, type ClientConfig } from './http/client';
// session
export { useAuthStore, useIsAuthenticated, type AuthStatus } from './session/auth-store';
export { endSession, restoreSession, startSession } from './session/session';
export type { StateStorage } from 'zustand/middleware';
// preferences + i18n
export {
  loadPreferences,
  usePreferencesStore,
  type ThemePreference,
} from './preferences/preferences-store';
export { createAppI18n } from './i18n/i18n';
// react-query
export { createQueryClient, type QueryClientOptions } from './query/query-client';
// forms
export { setServerErrors, useZodForm } from './form/use-zod-form';
// realtime
export { getSocket, useRealtimeConnection, useSocketEvent, type AppSocket } from './socket/socket';
// dates
export { dayjs, formatDate, formatDateTime, fromNow } from './date/date';

// geo
export { formatCoordinates } from './geo/geo';
// features
export * from './features/auth/auth.queries';
export * from './features/tasks/tasks.queries';
export * from './features/devices/devices.api';
