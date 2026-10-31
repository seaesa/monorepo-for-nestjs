import { TransactionHost } from '@nestjs-cls/transactional';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { translator } from '../../infra/i18n/translator';
import type { PrismaTx } from '../../infra/prisma/transaction';
import { PushService } from '../../infra/push/push.service';
import { QueueName, ReminderJob, type ReminderJobData } from '../../infra/queue/queues';
import { isReminderDue } from './task-reminder.policy';

/** Runs in the worker process only (registered in WorkerModule). */
@Processor(QueueName.REMINDERS)
export class TaskReminderProcessor extends WorkerHost {
  constructor(
    private readonly db: TransactionHost<PrismaTx>,
    private readonly push: PushService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== ReminderJob.TASK_DUE) throw new Error(`Unknown reminder job: ${job.name}`);
    const { taskId } = job.data as ReminderJobData[typeof ReminderJob.TASK_DUE];

    const task = await this.db.tx.task.findUnique({
      where: { id: taskId },
      include: { owner: { select: { locale: true } } },
    });
    if (!task || !isReminderDue(task, new Date())) return;

    const t = translator(task.owner.locale, 'push');
    await this.push.toUser(task.ownerId, {
      title: t('taskDue.title'),
      body: t('taskDue.body', { title: task.title }),
      data: { url: `/tasks/${task.id}` },
    });
  }
}
