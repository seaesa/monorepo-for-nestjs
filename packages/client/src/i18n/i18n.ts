import type { i18n as I18n, TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';

import { type Locale } from '@repo/contracts';
import { createI18n, zodErrorMap } from '@repo/i18n';

import { usePreferencesStore } from '../preferences/preferences-store';

/**
 * The app's i18next instance, wired to react-i18next, to zod's built-in messages and to
 * `usePreferencesStore().locale`. Create once at app start; components use `useTranslation()`.
 */
let appT: TFunction | undefined;

/** The app instance's `t`, for code outside components (error mapping in mutation callbacks). */
export function getAppT(): TFunction {
  if (!appT) throw new Error('createAppI18n() must run before getAppT()');
  return appT;
}

export function createAppI18n(locale: Locale = usePreferencesStore.getState().locale): I18n {
  const i18n = createI18n(locale, [initReactI18next]);
  const t = i18n.t.bind(i18n) as TFunction;
  appT = t;
  z.config({ customError: zodErrorMap(t) });
  usePreferencesStore.subscribe((state, previous) => {
    if (state.locale !== previous.locale) void i18n.changeLanguage(state.locale);
  });
  return i18n;
}
