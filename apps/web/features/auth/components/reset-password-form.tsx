'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { setServerErrors, useResetPasswordMutation, useZodForm } from '@repo/client';
import { resetPasswordSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldGroup } from '@/components/ui/field';

import { AuthCard } from './auth-card';

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useTranslation('auth');
  const form = useZodForm(resetPasswordSchema, { defaultValues: { token, password: '' } });
  const reset = useResetPasswordMutation();

  const onSubmit = form.handleSubmit((values) =>
    reset.mutate(values, { onError: (error) => setServerErrors(form, error) }),
  );

  return (
    <AuthCard title={t('reset.title')}>
      {reset.isSuccess ? (
        <FieldDescription>
          {t('reset.done')}{' '}
          <Link href="/login" className="underline">
            {t('login.submit')}
          </Link>
        </FieldDescription>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <TextField
              form={form}
              name="password"
              label={t('fields.password')}
              type="password"
              autoComplete="new-password"
            />
            <FormError form={form} />
            <Button type="submit" disabled={reset.isPending}>
              {t('reset.submit')}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  );
}
