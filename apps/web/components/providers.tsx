'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import {
  configureClient,
  createAppI18n,
  createQueryClient,
  loadPreferences,
  restoreSession,
  usePreferencesStore,
  useRealtimeConnection,
} from '@repo/client';
import type { Locale } from '@repo/contracts';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS } from '@/lib/cookies';
import { env } from '@/lib/env';

configureClient({ apiUrl: env.NEXT_PUBLIC_API_URL, auth: { mode: 'cookie' } });

function useLocaleSync() {
  const router = useRouter();
  useEffect(
    () =>
      usePreferencesStore.subscribe((state, previous) => {
        if (state.locale === previous.locale) return;
        document.cookie = `${LOCALE_COOKIE}=${state.locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
        document.documentElement.lang = state.locale;
        // Server components rendered text in the old language.
        router.refresh();
      }),
    [router],
  );
}

function Session() {
  useRealtimeConnection();
  useLocaleSync();
  useEffect(() => {
    void restoreSession();
  }, []);
  return null;
}

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [i18n] = useState(() => {
    usePreferencesStore.setState({ locale });
    return createAppI18n(locale);
  });

  useEffect(() => {
    void loadPreferences(localStorage, { locale });
  }, [locale]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <Session />
          {children}
          <Toaster />
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
