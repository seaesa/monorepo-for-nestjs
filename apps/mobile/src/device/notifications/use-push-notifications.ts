import * as Notifications from 'expo-notifications';
import { type Href, router } from 'expo-router';
import { useEffect } from 'react';

import { useIsAuthenticated } from '@repo/client';

import { registerForPush } from './push-token';

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
});

/** Pushes carry `data.url` (an app path); tapping one opens it. */
function openFrom(response: Notifications.NotificationResponse | null): void {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === 'string') router.push(url as Href);
}

/** Registers for push while signed in and routes notification taps. Mount once, inside the router. */
export function usePushNotifications(): void {
  const signedIn = useIsAuthenticated();

  useEffect(() => {
    if (signedIn) void registerForPush();
  }, [signedIn]);

  useEffect(() => {
    openFrom(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(openFrom);
    return () => subscription.remove();
  }, []);
}
