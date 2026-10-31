import { createInstance, type i18n as I18n, type Module } from 'i18next';

import { defaultLocale, type Locale, locales } from '@repo/contracts';

import { en } from './locales/en';
import { vi } from './locales/vi';
import type { Dictionary } from './types';

export const resources = { en, vi } satisfies Record<Locale, Dictionary<typeof en>>;

export type Namespace = keyof typeof en;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof en;
  }
}

/**
 * A ready-to-use i18next instance (initialized synchronously, resources bundled).
 * Frontends create one per app (passing `initReactI18next`); the server caches one per locale.
 */
export function createI18n(locale: Locale = defaultLocale, plugins: Module[] = []): I18n {
  const instance = createInstance();
  for (const plugin of plugins) instance.use(plugin);
  void instance.init({
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    ns: Object.keys(en),
    defaultNS: 'common',
    resources,
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}
