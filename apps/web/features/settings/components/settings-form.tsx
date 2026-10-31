'use client';

import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

import { useChangeLocale, useLogoutMutation, usePreferencesStore } from '@repo/client';
import { locales, type Locale } from '@repo/contracts';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const themes = ['system', 'light', 'dark'] as const;

export function SettingsForm() {
  const { t } = useTranslation();
  const locale = usePreferencesStore((s) => s.locale);
  const changeLocale = useChangeLocale();
  const { theme = 'system', setTheme } = useTheme();
  const logout = useLogoutMutation();

  const languageItems = locales.map((value) => ({ value, label: t(`languages.${value}`) }));
  const themeItems = themes.map((value) => ({ value, label: t(`settings.themes.${value}`) }));

  return (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel>{t('settings.language')}</FieldLabel>
        <Select
          items={languageItems}
          value={locale}
          onValueChange={(next: Locale | null) => next && changeLocale(next)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>{t('settings.theme')}</FieldLabel>
        <Select items={themeItems} value={theme} onValueChange={(next) => next && setTheme(next)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {themeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button variant="outline" disabled={logout.isPending} onClick={() => logout.mutate()}>
        {t('logout', { ns: 'auth' })}
      </Button>
    </FieldGroup>
  );
}
