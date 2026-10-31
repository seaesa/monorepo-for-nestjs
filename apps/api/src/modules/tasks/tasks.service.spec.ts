import type { TransactionHost } from '@nestjs-cls/transactional';

import { ErrorCode } from '@repo/contracts';

import type { AuthUser } from '../../common/auth';
import type { PrismaTx } from '../../infra/prisma/transaction';
import type { RealtimeService } from '../../infra/realtime/realtime.service';
import type { TaskRemindersService } from './task-reminders.service';
import { TasksService } from './tasks.service';

const row = {
  id: '0190a8c4-0000-7000-8000-000000000001',
  ownerId: 'owner',
  title: 'Ship it',
  description: null,
  status: 'TODO' as const,
  dueAt: new Date('2026-01-02T00:00:00Z'),
  latitude: 10.77,
  longitude: 106.7,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const owner: AuthUser = { id: 'owner', email: 'owner@example.com', role: 'USER' };
const intruder: AuthUser = { id: 'intruder', email: 'intruder@example.com', role: 'USER' };

function setup() {
  const task = {
    findFirst: jest.fn(),
    create: jest.fn().mockResolvedValue(row),
    update: jest.fn().mockResolvedValue(row),
    delete: jest.fn(),
  };
  const reminders = { sync: jest.fn(), cancel: jest.fn() };
  const realtime = { toUser: jest.fn() };
  const service = new TasksService(
    { tx: { task } } as unknown as TransactionHost<PrismaTx>,
    reminders as unknown as TaskRemindersService,
    realtime as unknown as RealtimeService,
  );
  return { service, task, reminders, realtime };
}

describe('TasksService', () => {
  it("treats another user's task as missing and leaves it untouched", async () => {
    const { service, task, reminders } = setup();
    task.findFirst.mockResolvedValue(null);

    await expect(service.update(intruder, row.id, { status: 'DONE' })).rejects.toMatchObject({
      code: ErrorCode.TASK_NOT_FOUND,
    });
    await expect(service.remove(intruder, row.id)).rejects.toMatchObject({
      code: ErrorCode.TASK_NOT_FOUND,
    });
    expect(task.findFirst).toHaveBeenCalledWith({
      where: { AND: [expect.objectContaining({ OR: [{ ownerId: 'intruder' }] }), { id: row.id }] },
    });
    expect(task.update).not.toHaveBeenCalled();
    expect(task.delete).not.toHaveBeenCalled();
    expect(reminders.sync).not.toHaveBeenCalled();
  });

  it('re-plans the reminder after every change and tells the owner’s other sessions', async () => {
    const { service, task, reminders, realtime } = setup();
    task.findFirst.mockResolvedValue(row);

    await service.update(owner, row.id, { status: 'DONE' });

    expect(reminders.sync).toHaveBeenCalledWith(row);
    expect(realtime.toUser).toHaveBeenCalledWith(
      'owner',
      'task.changed',
      expect.objectContaining({ type: 'upserted' }),
    );
  });

  it('cancels the reminder when a task is deleted', async () => {
    const { service, task, reminders, realtime } = setup();
    task.findFirst.mockResolvedValue(row);

    await service.remove(owner, row.id);

    expect(reminders.cancel).toHaveBeenCalledWith(row.id);
    expect(realtime.toUser).toHaveBeenCalledWith('owner', 'task.changed', {
      type: 'deleted',
      id: row.id,
    });
  });

  it('clears due date and location on null, and leaves omitted fields alone', async () => {
    const { service, task } = setup();
    task.findFirst.mockResolvedValue(row);

    await service.update(owner, row.id, { dueAt: null, location: null });
    await service.update(owner, row.id, { title: 'Renamed' });

    expect(task.update).toHaveBeenNthCalledWith(1, {
      where: { id: row.id },
      data: { dueAt: null, latitude: null, longitude: null },
    });
    expect(task.update).toHaveBeenNthCalledWith(2, {
      where: { id: row.id },
      data: { title: 'Renamed' },
    });
  });

  it('returns the location as one point, never half of it', async () => {
    const { service, task } = setup();
    task.findFirst.mockResolvedValue(row);

    await expect(service.get(owner, row.id)).resolves.toMatchObject({
      location: { latitude: 10.77, longitude: 106.7 },
    });
    task.findFirst.mockResolvedValue({ ...row, latitude: null });
    await expect(service.get(owner, row.id)).resolves.toMatchObject({ location: null });
  });
});
