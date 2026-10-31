import { QueryClientProvider } from '@tanstack/react-query';
import { getLocales } from 'expo-localization';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Uniwind } from 'uniwind';

import {
  configureClient,
  createAppI18n,
  createQueryClient,
  loadPreferences,
  restoreSession,
  useAuthStore,
  usePreferencesStore,
  useRealtimeConnection,
} from '@repo/client';
import { resolveLocale } from '@repo/i18n';

import { env } from '@/lib/env';
import { appStorage, secureStorage } from '@/lib/storage';

configureClient({
  apiUrl: env.EXPO_PUBLIC_API_URL,
  auth: { mode: 'bearer', tokenStorage: secureStorage },
});
// First launch follows the device language; a choice made in Settings is persisted over it.
usePreferencesStore.setState({ locale: resolveLocale(getLocales().map((l) => l.languageTag)) });

Uniwind.setTheme(usePreferencesStore.getState().theme);
usePreferencesStore.subscribe((state, previous) => {
  if (state.theme !== previous.theme) Uniwind.setTheme(state.theme);
});

const i18n = createAppI18n();
const queryClient = createQueryClient();

/** True once saved preferences and the stored session have been read. Keep the splash until then. */
export function useAppReady(): boolean {
  const [preferencesReady, setPreferencesReady] = useState(false);
  const sessionKnown = useAuthStore((s) => s.status !== 'unknown');

  useEffect(() => {
    void loadPreferences(appStorage).finally(() => setPreferencesReady(true));
    void restoreSession();
  }, []);

  return preferencesReady && sessionKnown;
}

function Realtime() {
  useRealtimeConnection();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <Realtime />
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  );
}
