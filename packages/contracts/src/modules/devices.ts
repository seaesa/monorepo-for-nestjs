import { z } from 'zod';

import { okResponseSchema } from '../common';
import { limits } from '../limits';
import { defineRoute } from '../route';

export const devicePlatforms = ['ios', 'android'] as const;
export const devicePlatformSchema = z.enum(devicePlatforms);
export type DevicePlatform = z.output<typeof devicePlatformSchema>;

/** One row per push token: a user gets pushes on every device they are signed in on. */
export const registerDeviceSchema = z.object({
  /** Expo push token, e.g. `ExponentPushToken[…]`. */
  token: z.string().trim().min(1).max(limits.pushToken.max),
  platform: devicePlatformSchema,
});
export type RegisterDeviceInput = z.input<typeof registerDeviceSchema>;

export const unregisterDeviceSchema = registerDeviceSchema.pick({ token: true });

export const devicesRoutes = {
  register: defineRoute({
    method: 'POST',
    path: '/devices',
    body: registerDeviceSchema,
    response: okResponseSchema,
  }),
  // A POST, not DELETE + path param: push tokens contain characters that do not belong in URLs.
  unregister: defineRoute({
    method: 'POST',
    path: '/devices/unregister',
    body: unregisterDeviceSchema,
    response: okResponseSchema,
  }),
};
