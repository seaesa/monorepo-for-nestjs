import { accessibleBy } from '@casl/prisma/runtime';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import {
  type CreateTaskInput,
  ErrorCode,
  type ListTasksQuery,
  type RouteResult,
  type UpdateTaskInput,
  contract,
  taskSchema,
} from '@repo/contracts';

import type { AuthUser } from '../../common/auth';
import { defineAbilityFor } from '../../common/authorization';
import { AppException } from '../../common/exceptions';
import { pageArgs, pageMeta } from '../../common/pagination';
import type { Task as TaskRow } from '../../generated/prisma/client';
import type { PrismaTx } from '../../infra/prisma/transaction';
import { RealtimeService } from '../../infra/realtime/realtime.service';
import { TaskRemindersService } from './task-reminders.service';

type TaskResult = RouteResult<typeof contract.tasks.get>;

/** Access comes from the ability (`common/authorization`); a task the actor may not see is "not found". */
@Injectable()
export class TasksService {
  constructor(
    private readonly db: TransactionHost<PrismaTx>,
    private readonly reminders: TaskRemindersService,
    private readonly realtime: RealtimeService,
  ) {}

  async list(
    actor: AuthUser,
    query: Required<Pick<ListTasksQuery, 'page' | 'limit'>> & Pick<ListTasksQuery, 'status'>,
  ): Promise<RouteResult<typeof contract.tasks.list>> {
    const where = {
      AND: [accessibleBy(defineAbilityFor(actor)).ofType('Task'), { status: query.status }],
    };
    const [rows, total] = await Promise.all([
      this.db.tx.task.findMany({ where, orderBy: { createdAt: 'desc' }, ...pageArgs(query) }),
      this.db.tx.task.count({ where }),
    ]);
    return { items: rows.map(toTask), meta: pageMeta(query, total) };
  }

  async get(actor: AuthUser, id: string): Promise<TaskResult> {
    return toTask(await this.find(actor, id, 'read'));
  }

  async create(actor: AuthUser, input: CreateTaskInput): Promise<TaskResult> {
    const row = await this.db.tx.task.create({
      data: { ownerId: actor.id, ...toColumns(input), title: input.title },
    });
    return this.changed(row);
  }

  async update(actor: AuthUser, id: string, input: UpdateTaskInput): Promise<TaskResult> {
    await this.find(actor, id, 'update');
    const row = await this.db.tx.task.update({ where: { id }, data: toColumns(input) });
    return this.changed(row);
  }

  async remove(actor: AuthUser, id: string): Promise<void> {
    const { ownerId } = await this.find(actor, id, 'delete');
    await this.db.tx.task.delete({ where: { id } });
    await this.reminders.cancel(id);
    this.realtime.toUser(ownerId, 'task.changed', { type: 'deleted', id });
  }

  private async find(
    actor: AuthUser,
    id: string,
    action: 'read' | 'update' | 'delete',
  ): Promise<TaskRow> {
    const allowed = accessibleBy(defineAbilityFor(actor), action).ofType('Task');
    const row = await this.db.tx.task.findFirst({ where: { AND: [allowed, { id }] } });
    if (!row) throw new AppException(ErrorCode.TASK_NOT_FOUND);
    return row;
  }

  private async changed(row: TaskRow): Promise<TaskResult> {
    await this.reminders.sync(row);
    const task = toTask(row);
    // Sockets skip the response serializer, so serialize to the wire shape here.
    this.realtime.toUser(row.ownerId, 'task.changed', {
      type: 'upserted',
      task: taskSchema.parse(task),
    });
    return task;
  }
}

function toTask(row: TaskRow): TaskResult {
  const { latitude, longitude, ownerId: _ownerId, ...rest } = row;
  return {
    ...rest,
    location: latitude !== null && longitude !== null ? { latitude, longitude } : null,
  };
}

/** `undefined` leaves a column untouched, `null` clears it. */
function toColumns(input: UpdateTaskInput) {
  const { location, dueAt, ...rest } = input;
  return {
    ...rest,
    ...(dueAt !== undefined && { dueAt: dueAt === null ? null : new Date(dueAt) }),
    ...(location !== undefined && {
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
    }),
  };
}
