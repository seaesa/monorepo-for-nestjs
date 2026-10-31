import { Controller, Param } from '@nestjs/common';

import { contract, type RouteBody, type RouteQuery, type RouteResult } from '@repo/contracts';

import { type AuthUser, CurrentUser } from '../../common/auth';
import { Endpoint, ReqBody, ReqQuery } from '../../common/contract';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { TasksService } from './tasks.service';

const r = contract.tasks;

@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Endpoint(r.list)
  list(
    @CurrentUser() user: AuthUser,
    @ReqQuery() query: RouteQuery<typeof r.list>,
  ): Promise<RouteResult<typeof r.list>> {
    return this.tasks.list(user, query);
  }

  @Endpoint(r.get)
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<RouteResult<typeof r.get>> {
    return this.tasks.get(user, id);
  }

  @Endpoint(r.create)
  create(
    @CurrentUser() user: AuthUser,
    @ReqBody() body: RouteBody<typeof r.create>,
  ): Promise<RouteResult<typeof r.create>> {
    return this.tasks.create(user, body);
  }

  @Endpoint(r.update)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIdPipe) id: string,
    @ReqBody() body: RouteBody<typeof r.update>,
  ): Promise<RouteResult<typeof r.update>> {
    return this.tasks.update(user, id, body);
  }

  @Endpoint(r.remove)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<RouteResult<typeof r.remove>> {
    await this.tasks.remove(user, id);
    return { ok: true };
  }
}
