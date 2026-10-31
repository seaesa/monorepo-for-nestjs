import { Redirect, Stack } from 'expo-router';

import { useIsAuthenticated } from '@repo/client';

export default function AuthLayout() {
  if (useIsAuthenticated()) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
