import { createEnv } from '@t3-oss/env-core';
import Constants from 'expo-constants';
import { z } from 'zod';

const API_DEV_PORT = 3000;

/** In development the API runs on the machine that serves Metro, so reuse its host. */
function devApiUrl(): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:${API_DEV_PORT}`;
}

/**
 * The only place the app reads `process.env`. Expo inlines `EXPO_PUBLIC_*` only for static
 * `process.env.X` access, so every variable is listed in `runtimeEnv` by name.
 * Release builds must set them (eas.json `env`); development falls back to the Metro host.
 */
export const env = createEnv({
  clientPrefix: 'EXPO_PUBLIC_',
  client: {
    EXPO_PUBLIC_API_URL: __DEV__ ? z.url().default(devApiUrl()) : z.url(),
    /** Unset = Sentry stays off. */
    EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
    /** Share of app starts and navigations traced, 0–1. */
    EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  },
  runtimeEnv: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  },
  emptyStringAsUndefined: true,
});
