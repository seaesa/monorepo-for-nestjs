import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useIsAuthenticated, useTasksRealtime } from '@repo/client';

import { usePushNotifications } from '@/device/notifications/use-push-notifications';

function SignedInEffects() {
  usePushNotifications();
  useTasksRealtime();
  return null;
}

export default function AppLayout() {
  const { t } = useTranslation();
  if (!useIsAuthenticated()) return <Redirect href="/login" />;
  return (
    <>
      <SignedInEffects />
      <Stack>
        <Stack.Screen name="index" options={{ title: t('title', { ns: 'tasks' }) }} />
        <Stack.Screen
          name="tasks/new"
          options={{ title: t('new', { ns: 'tasks' }), presentation: 'modal' }}
        />
        <Stack.Screen name="tasks/[id]" options={{ title: '' }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      </Stack>
    </>
  );
}
