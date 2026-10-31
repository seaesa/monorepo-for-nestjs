import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { MailJob, type MailJobData, QueueName } from '../../infra/queue/queues';

/** Producer side: enqueue mail jobs from the API. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@InjectQueue(QueueName.MAIL) private readonly queue: Queue) {}

  async sendWelcome(data: MailJobData[typeof MailJob.WELCOME]): Promise<void> {
    await this.queue.add(MailJob.WELCOME, data, { jobId: `welcome-${data.userId}` });
  }

  async sendPasswordReset(data: MailJobData[typeof MailJob.PASSWORD_RESET]): Promise<void> {
    await this.queue.add(MailJob.PASSWORD_RESET, data);
  }

  async sendEmailVerification(data: MailJobData[typeof MailJob.VERIFY_EMAIL]): Promise<void> {
    await this.queue.add(MailJob.VERIFY_EMAIL, data);
  }

  /**
   * Enqueue without letting the queue become a dependency of the request.
   * A mail server outage must never fail a registration that already committed.
   */
  enqueue(operation: () => Promise<unknown>, label: string): void {
    void operation().catch((error: unknown) => {
      this.logger.warn({ err: error }, `Could not enqueue ${label} mail`);
    });
  }
}
