import { isReminderDue, reminderDelay } from './task-reminder.policy';

const now = new Date('2026-01-01T10:00:00Z');
const inMinutes = (minutes: number) => new Date(now.getTime() + minutes * 60_000);

describe('reminderDelay', () => {
  it('waits until the due time of an open task', () => {
    expect(reminderDelay({ status: 'TODO', dueAt: inMinutes(30) }, now)).toBe(30 * 60_000);
    expect(reminderDelay({ status: 'IN_PROGRESS', dueAt: inMinutes(1) }, now)).toBe(60_000);
  });

  it('schedules nothing for done tasks, tasks without a due date, or past due dates', () => {
    expect(reminderDelay({ status: 'DONE', dueAt: inMinutes(30) }, now)).toBeNull();
    expect(reminderDelay({ status: 'TODO', dueAt: null }, now)).toBeNull();
    expect(reminderDelay({ status: 'TODO', dueAt: inMinutes(-1) }, now)).toBeNull();
  });
});

describe('isReminderDue', () => {
  it('notifies for an open task whose due time has come, even if the worker ran late', () => {
    expect(isReminderDue({ status: 'TODO', dueAt: now }, now)).toBe(true);
    expect(isReminderDue({ status: 'TODO', dueAt: inMinutes(-120) }, now)).toBe(true);
  });

  it('drops stale jobs: deleted, finished, or moved to a later due time', () => {
    expect(isReminderDue(null, now)).toBe(false);
    expect(isReminderDue({ status: 'DONE', dueAt: now }, now)).toBe(false);
    expect(isReminderDue({ status: 'TODO', dueAt: null }, now)).toBe(false);
    expect(isReminderDue({ status: 'TODO', dueAt: inMinutes(10) }, now)).toBe(false);
  });
});
