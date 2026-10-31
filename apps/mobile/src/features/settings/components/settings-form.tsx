import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useChangeLocale, useLogoutMutation, usePreferencesStore } from '@repo/client';
import { locales, type Locale } from '@repo/contracts';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { unregisterForPush } from '@/device/notifications/push-token';

const themes = ['system', 'light', 'dark'] as const;

export function SettingsForm() {
  const { t } = useTranslation();
  const locale = usePreferencesStore((s) => s.locale);
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const changeLocale = useChangeLocale();
  const logout = useLogoutMutation();

  // The device token is dropped first: once the session ends the API can't tell whose it is.
  const signOut = () => void unregisterForPush().then(() => logout.mutate());

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Label>{t('settings.language')}</Label>
        <View className="flex-row gap-2">
          {locales.map((value: Locale) => (
            <Button
              key={value}
              size="sm"
              variant={value === locale ? 'default' : 'outline'}
              onPress={() => changeLocale(value)}
            >
              <Text>{t(`languages.${value}`)}</Text>
            </Button>
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Label>{t('settings.theme')}</Label>
        <View className="flex-row gap-2">
          {themes.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={value === theme ? 'default' : 'outline'}
              onPress={() => setTheme(value)}
            >
              <Text>{t(`settings.themes.${value}`)}</Text>
            </Button>
          ))}
        </View>
      </View>
      <Button variant="outline" disabled={logout.isPending} onPress={signOut}>
        <Text>{t('logout', { ns: 'auth' })}</Text>
      </Button>
    </View>
  );
}
