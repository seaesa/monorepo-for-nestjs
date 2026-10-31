import type { GeoPoint } from '@repo/contracts';

/** Five decimals is about one metre: enough to find the place, not enough to look noisy. */
const COORDINATE_DECIMALS = 5;

export function formatCoordinates({ latitude, longitude }: GeoPoint): string {
  return `${latitude.toFixed(COORDINATE_DECIMALS)}, ${longitude.toFixed(COORDINATE_DECIMALS)}`;
}
