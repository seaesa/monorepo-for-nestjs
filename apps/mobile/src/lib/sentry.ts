import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { env } from './env';

/** No-op without a DSN. The variant (development/preview/production) is the Sentry environment. */
export function initSentry(): void {
  if (!env.EXPO_PUBLIC_SENTRY_DSN) return;
  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    environment: Constants.expoConfig?.extra?.variant as string | undefined,
    tracesSampleRate: env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  });
}
