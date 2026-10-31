import { Module } from '@nestjs/common';

import { InfraModule } from './infra/infra.module';
import { MailProcessor } from './modules/mail/mail.processor';
import { TaskReminderProcessor } from './modules/tasks/task-reminder.processor';

/** Background job processors. Runs as a separate process: `node dist/worker.js`. */
@Module({
  imports: [InfraModule],
  providers: [MailProcessor, TaskReminderProcessor],
})
export class WorkerModule {}
