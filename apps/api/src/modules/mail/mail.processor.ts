import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, type OnApplicationBootstrap } from '@nestjs/common';
import type { Job } from 'bullmq';

import { AppConfig } from '../../config/app-config.service';
import { translator } from '../../infra/i18n/translator';
import { MailJob, type MailJobData, QueueName } from '../../infra/queue/queues';
import { RealtimeService } from '../../infra/realtime/realtime.service';

/** Consumer side: runs in the worker process only (registered in WorkerModule). */
@Processor(QueueName.MAIL)
export class MailProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly realtime: RealtimeService,
    private readonly config: AppConfig,
  ) {
    super();
  }

  onApplicationBootstrap(): void {
    this.worker.concurrency = this.config.get('WORKER_CONCURRENCY');
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case MailJob.WELCOME:
        return this.welcome(job.data as MailJobData[typeof MailJob.WELCOME]);
      case MailJob.PASSWORD_RESET:
        return this.passwordReset(job.data as MailJobData[typeof MailJob.PASSWORD_RESET]);
      case MailJob.VERIFY_EMAIL:
        return this.verifyEmail(job.data as MailJobData[typeof MailJob.VERIFY_EMAIL]);
      default:
        throw new Error(`Unknown mail job: ${job.name}`);
    }
  }

  private async welcome({
    userId,
    email,
    name,
    locale,
  }: MailJobData[typeof MailJob.WELCOME]): Promise<void> {
    const t = translator(locale, 'email');
    // Plug a real provider (Resend, SES, ...) here.
    this.logger.log(`Sending welcome email to ${email}`);
    this.realtime.toUser(userId, 'notification', {
      id: crypto.randomUUID(),
      title: t('welcome.title', { name }),
      body: t('welcome.body'),
      createdAt: new Date().toISOString(),
    });
  }

  private async passwordReset({
    email,
    token,
    locale,
  }: MailJobData[typeof MailJob.PASSWORD_RESET]): Promise<void> {
    const t = translator(locale, 'email');
    const link = this.webLink('/reset-password', token);
    // Plug a real provider (Resend, SES, ...) here.
    this.logger.log(`Sending "${t('passwordReset.subject')}" to ${email}`);
    this.logger.debug(t('passwordReset.body', { link }));
  }

  private async verifyEmail({
    email,
    token,
    locale,
  }: MailJobData[typeof MailJob.VERIFY_EMAIL]): Promise<void> {
    const t = translator(locale, 'email');
    const link = this.webLink('/verify-email', token);
    // Plug a real provider (Resend, SES, ...) here.
    this.logger.log(`Sending "${t('verifyEmail.subject')}" to ${email}`);
    this.logger.debug(t('verifyEmail.body', { link }));
  }

  private webLink(path: string, token: string): string {
    return `${this.config.get('WEB_APP_URL')}${path}?token=${encodeURIComponent(token)}`;
  }
}
