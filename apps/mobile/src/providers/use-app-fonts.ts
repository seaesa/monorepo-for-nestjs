import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';

import { fonts } from '@repo/theme';

/**
 * Registers every Figtree weight under one family name (`fonts.sans` from @repo/theme),
 * so `font-sans` + `font-medium`/`font-semibold`/`font-bold` pick the right face.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts([
    {
      fontFamily: fonts.sans,
      fontDefinitions: [
        { path: Figtree_400Regular, weight: 400, style: 'normal' },
        { path: Figtree_500Medium, weight: 500, style: 'normal' },
        { path: Figtree_600SemiBold, weight: 600, style: 'normal' },
        { path: Figtree_700Bold, weight: 700, style: 'normal' },
      ],
    },
  ]);
  // Render with system fonts rather than a blank screen if loading fails.
  return loaded || error !== null;
}
