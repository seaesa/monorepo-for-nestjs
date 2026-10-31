import type { TaskStatus } from '@repo/contracts';

interface ReminderTarget {
  status: TaskStatus;
  dueAt: Date | null;
}

/** Jobs may run a little early relative to the API clock; within this window they still count. */
const CLOCK_SKEW_MS = 5_000;

/**
 * Milliseconds until the due reminder, or `null` when the task gets none:
 * done tasks, tasks without a due date, and due dates already in the past.
 */
export function reminderDelay(task: ReminderTarget, now: Date): number | null {
  if (task.status === 'DONE' || !task.dueAt) return null;
  const delay = task.dueAt.getTime() - now.getTime();
  return delay > 0 ? delay : null;
}

/**
 * Re-checked when the job runs: the task may have been finished, deleted or moved to a later due
 * date after the job was queued, and a stale job must not notify.
 */
export function isReminderDue(task: ReminderTarget | null, now: Date): boolean {
  if (!task || task.status === 'DONE' || !task.dueAt) return false;
  return task.dueAt.getTime() <= now.getTime() + CLOCK_SKEW_MS;
}
