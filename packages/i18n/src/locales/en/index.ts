import { auth } from './auth';
import { common } from './common';
import { email } from './email';
import { errors } from './errors';
import { push } from './push';
import { tasks } from './tasks';
import { validation } from './validation';

/** The source dictionary. Every other locale is typed against it. */
export const en = { common, errors, validation, email, auth, tasks, push } as const;
