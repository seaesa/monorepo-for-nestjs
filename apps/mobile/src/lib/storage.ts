import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { StateStorage } from '@repo/client';

/** Keychain / Keystore. For secrets only (tokens): small values, slower than AsyncStorage. */
export const secureStorage: StateStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const appStorage: StateStorage = AsyncStorage;
