import type { Locale } from '@repo/contracts';

/** Queue names and job payloads. Producers and processors import from here only. */
export const QueueName = {
  MAIL: 'mail',
  REMINDERS: 'reminders',
} as const;

export const MailJob = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  VERIFY_EMAIL: 'verify-email',
} as const;

export interface MailRecipient {
  userId: string;
  email: string;
  name: string;
  locale: Locale;
}

export interface MailJobData {
  [MailJob.WELCOME]: MailRecipient;
  [MailJob.PASSWORD_RESET]: MailRecipient & { token: string };
  [MailJob.VERIFY_EMAIL]: MailRecipient & { token: string };
}

export const ReminderJob = {
  TASK_DUE: 'task-due',
} as const;

export interface ReminderJobData {
  [ReminderJob.TASK_DUE]: { taskId: string };
}
