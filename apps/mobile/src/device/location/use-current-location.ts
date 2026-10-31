import * as Location from 'expo-location';
import { useState } from 'react';

import type { GeoPoint } from '@repo/contracts';

type State = { status: 'idle' | 'locating' | 'denied' } | { status: 'error'; error: unknown };

/** Reads the position once, on demand. Asks for "while in use" permission the first time. */
export function useCurrentLocation() {
  const [state, setState] = useState<State>({ status: 'idle' });

  async function locate(): Promise<GeoPoint | null> {
    setState({ status: 'locating' });
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setState({ status: 'denied' });
        return null;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState({ status: 'idle' });
      return { latitude: coords.latitude, longitude: coords.longitude };
    } catch (error) {
      setState({ status: 'error', error });
      return null;
    }
  }

  return { locate, ...state };
}
