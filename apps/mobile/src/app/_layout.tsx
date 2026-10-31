import { PortalHost } from '@rn-primitives/portal';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { initSentry } from '@/lib/sentry';
import { AppProviders, useAppReady } from '@/providers/app-providers';
import { useAppFonts } from '@/providers/use-app-fonts';

export { ErrorBoundary } from 'expo-router';

initSentry();
void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const fontsReady = useAppFonts();
  const appReady = useAppReady();
  const ready = fontsReady && appReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
          <PortalHost />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
