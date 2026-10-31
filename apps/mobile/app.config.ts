import type { ConfigContext, ExpoConfig } from 'expo/config';
import { z } from 'zod';

/**
 * One app, three installable variants side by side on a device. `APP_VARIANT` is set per build
 * profile in eas.json; local `expo start` is `development`.
 */
const buildEnv = z
  .object({
    APP_VARIANT: z.enum(['development', 'preview', 'production']).default('development'),
    APP_VERSION: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .default('1.0.0'),
    /** Written by `eas init`; read from the environment so forks don't inherit someone's project. */
    EAS_PROJECT_ID: z.uuid().optional(),
    /** Source map upload at build time; also needs the SENTRY_AUTH_TOKEN EAS secret. */
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
  })
  .parse({
    APP_VARIANT: process.env.APP_VARIANT,
    APP_VERSION: process.env.APP_VERSION,
    EAS_PROJECT_ID: process.env.EAS_PROJECT_ID || undefined,
    SENTRY_ORG: process.env.SENTRY_ORG || undefined,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT || undefined,
  });

const variant = buildEnv.APP_VARIANT;

// Replace with your own reverse-DNS id before the first store build (see docs/agents/mobile-release.md).
const BASE_ID = 'com.example.monorepostarter';
const id = variant === 'production' ? BASE_ID : `${BASE_ID}.${variant}`;
const name = variant === 'production' ? 'Monorepo Starter' : `Monorepo Starter (${variant})`;

const projectId = buildEnv.EAS_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name,
  slug: 'monorepo-starter',
  version: buildEnv.APP_VERSION,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'monorepostarter',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: id,
    icon: './assets/expo.icon',
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: id,
    adaptiveIcon: {
      backgroundColor: '#fafafa',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: 'server', favicon: './assets/images/favicon.png' },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      { backgroundColor: '#fafafa', image: './assets/images/splash-icon.png', imageWidth: 76 },
    ],
    'expo-font',
    'expo-status-bar',
    'expo-secure-store',
    'expo-localization',
    'expo-notifications',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Attach your location to a task when you choose to.',
      },
    ],
    '@react-native-community/datetimepicker',
    [
      '@sentry/react-native/expo',
      { organization: buildEnv.SENTRY_ORG, project: buildEnv.SENTRY_PROJECT },
    ],
  ],
  // OTA updates must only reach binaries with the same native code: the app version is that key.
  runtimeVersion: { policy: 'appVersion' },
  updates: projectId ? { url: `https://u.expo.dev/${projectId}` } : { enabled: false },
  extra: { eas: { projectId }, variant },
  experiments: { typedRoutes: true, reactCompiler: true },
});
