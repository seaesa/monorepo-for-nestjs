import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { defaultLocale, type Locale } from '@repo/contracts';

import { dayjs } from '../date/date';

export type ThemePreference = 'system' | 'light' | 'dark';

interface PreferencesState {
  locale: Locale;
  theme: ThemePreference;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
}

let platformStorage: StateStorage | undefined;

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      theme: 'system',
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'preferences',
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (name) => platformStorage?.getItem(name) ?? null,
        setItem: (name, value) => platformStorage?.setItem(name, value),
        removeItem: (name) => platformStorage?.removeItem(name),
      })),
      partialize: ({ locale, theme }) => ({ locale, theme }),
    },
  ),
);

usePreferencesStore.subscribe((state, previous) => {
  if (state.locale !== previous.locale) dayjs.locale(state.locale);
});

/**
 * Loads saved preferences. `initial` wins over what is stored when the platform already knows
 * the answer (web: the locale cookie the server rendered with).
 */
export async function loadPreferences(
  storage: StateStorage,
  initial: Partial<Pick<PreferencesState, 'locale' | 'theme'>> = {},
): Promise<void> {
  platformStorage = storage;
  await usePreferencesStore.persist.rehydrate();
  usePreferencesStore.setState(initial);
  dayjs.locale(usePreferencesStore.getState().locale);
}
