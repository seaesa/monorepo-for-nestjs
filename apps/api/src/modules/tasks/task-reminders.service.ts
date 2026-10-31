import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { QueueName, ReminderJob, type ReminderJobData } from '../../infra/queue/queues';
import { reminderDelay } from './task-reminder.policy';

type Data = ReminderJobData[typeof ReminderJob.TASK_DUE];

/** One delayed job per task, keyed by task id, so it can be replaced or cancelled. */
@Injectable()
export class TaskRemindersService {
  private readonly logger = new Logger(TaskRemindersService.name);

  constructor(@InjectQueue(QueueName.REMINDERS) private readonly queue: Queue<Data>) {}

  /** Call after every create/update: replaces any pending reminder with one for the current state. */
  async sync(task: Parameters<typeof reminderDelay>[0] & { id: string }): Promise<void> {
    await this.cancel(task.id);
    const delay = reminderDelay(task, new Date());
    if (delay === null) return;
    await this.queue.add(
      ReminderJob.TASK_DUE,
      { taskId: task.id },
      { jobId: jobId(task.id), delay },
    );
  }

  async cancel(taskId: string): Promise<void> {
    try {
      // Also removes a finished job with the same id; BullMQ would otherwise ignore the next add.
      await this.queue.remove(jobId(taskId));
    } catch (error) {
      // The job is running right now; the processor re-checks the task, so it will not misfire.
      this.logger.debug(`Reminder ${taskId} is running, left as is: ${String(error)}`);
    }
  }
}

const jobId = (taskId: string) => `task-due-${taskId}`;
