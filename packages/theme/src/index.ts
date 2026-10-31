import { oklchToRgb } from './color';
import { type ColorScheme, type ColorToken, colors } from './tokens';

export * from './tokens';
export { oklchToRgb } from './color';

/**
 * The palette as hex/rgba for JS APIs that need raw colors on native
 * (React Navigation theme, StatusBar, icon `color` props, charts).
 * In markup, prefer Tailwind classes (`text-primary`) over these values.
 */
export const rgbColors = Object.fromEntries(
  (Object.keys(colors) as ColorScheme[]).map((scheme) => [
    scheme,
    Object.fromEntries(
      Object.entries(colors[scheme]).map(([token, value]) => [token, oklchToRgb(value)]),
    ),
  ]),
) as Record<ColorScheme, Record<ColorToken, string>>;
