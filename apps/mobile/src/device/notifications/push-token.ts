import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerDevice, unregisterDevice } from '@repo/client';

let registeredToken: string | undefined;

/**
 * Asks for permission and sends this device's Expo push token to the API. Returns quietly when
 * push is impossible here: simulators, a denied permission, or a build without an EAS project.
 */
export async function registerForPush(): Promise<void> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!Device.isDevice || !projectId) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerDevice({ token, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
  registeredToken = token;
}

/** Call before signing out, while the session can still authenticate the request. */
export async function unregisterForPush(): Promise<void> {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = undefined;
  await unregisterDevice(token).catch(() => undefined);
}
