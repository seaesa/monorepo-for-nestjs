import { contract, type RegisterDeviceInput } from '@repo/contracts';

import { request } from '../../http/client';

/** Push tokens are registered outside react-query: they follow the session, not a screen. */
export const registerDevice = (body: RegisterDeviceInput) =>
  request(contract.devices.register, { body });

export const unregisterDevice = (token: string) =>
  request(contract.devices.unregister, { body: { token } });
