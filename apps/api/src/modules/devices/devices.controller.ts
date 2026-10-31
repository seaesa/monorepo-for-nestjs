import { Controller, HttpCode, HttpStatus } from '@nestjs/common';

import { contract, type RouteBody, type RouteResult } from '@repo/contracts';

import { type AuthUser, CurrentUser } from '../../common/auth';
import { Endpoint, ReqBody } from '../../common/contract';
import { DevicesService } from './devices.service';

const r = contract.devices;

@Controller()
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Endpoint(r.register)
  @HttpCode(HttpStatus.OK)
  async register(
    @CurrentUser() user: AuthUser,
    @ReqBody() body: RouteBody<typeof r.register>,
  ): Promise<RouteResult<typeof r.register>> {
    await this.devices.register(user.id, body);
    return { ok: true };
  }

  @Endpoint(r.unregister)
  @HttpCode(HttpStatus.OK)
  async unregister(
    @CurrentUser() user: AuthUser,
    @ReqBody() body: RouteBody<typeof r.unregister>,
  ): Promise<RouteResult<typeof r.unregister>> {
    await this.devices.unregister(user.id, body.token);
    return { ok: true };
  }
}
