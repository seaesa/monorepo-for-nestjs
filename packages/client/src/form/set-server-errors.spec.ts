import { describe, expect, it, jest } from '@jest/globals';
import type { UseFormReturn } from 'react-hook-form';

import { ErrorCode } from '@repo/contracts';
import { createI18n } from '@repo/i18n';

import { ApiError } from '../http/api-error';
import { setServerErrors } from './use-zod-form';

const { t } = createI18n('vi');

interface Values {
  email: string;
  password?: string;
}

function fakeForm(values: Values) {
  const setError = jest.fn();
  const form = { getValues: () => values, setError } as unknown as Pick<
    UseFormReturn<Values>,
    'getValues' | 'setError'
  >;
  return { ...form, setError };
}

describe('setServerErrors', () => {
  it('puts field errors on the inputs that exist, in the active language', () => {
    const form = fakeForm({ email: '', password: '' });
    const error = new ApiError({
      code: ErrorCode.AUTH_EMAIL_TAKEN,
      statusCode: 409,
      message: 'taken',
      fieldErrors: [{ path: 'email', code: ErrorCode.AUTH_EMAIL_TAKEN, message: 'taken' }],
    });

    setServerErrors(form, error, t);

    expect(form.setError).toHaveBeenCalledTimes(1);
    expect(form.setError).toHaveBeenCalledWith('email', {
      type: ErrorCode.AUTH_EMAIL_TAKEN,
      message: t(ErrorCode.AUTH_EMAIL_TAKEN, { ns: 'errors' }),
    });
  });

  it('falls back to the form-level slot when no field matches', () => {
    const form = fakeForm({ email: '' });
    const error = new ApiError({ code: ErrorCode.FORBIDDEN, statusCode: 403, message: 'no' });

    setServerErrors(form, error, t);

    expect(form.setError).toHaveBeenCalledWith('root.server', {
      type: ErrorCode.FORBIDDEN,
      message: t(ErrorCode.FORBIDDEN, { ns: 'errors' }),
    });
  });
});
