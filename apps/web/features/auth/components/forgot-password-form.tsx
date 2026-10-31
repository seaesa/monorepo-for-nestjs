'use client';

import { useTranslation } from 'react-i18next';

import { setServerErrors, useForgotPasswordMutation, useZodForm } from '@repo/client';
import { forgotPasswordSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldGroup } from '@/components/ui/field';

import { AuthCard } from './auth-card';

export function ForgotPasswordForm() {
  const { t } = useTranslation('auth');
  const form = useZodForm(forgotPasswordSchema, { defaultValues: { email: '' } });
  const forgot = useForgotPasswordMutation();

  const onSubmit = form.handleSubmit((values) =>
    forgot.mutate(values, { onError: (error) => setServerErrors(form, error) }),
  );

  return (
    <AuthCard title={t('forgot.title')}>
      {forgot.isSuccess ? (
        <FieldDescription>{t('forgot.sent')}</FieldDescription>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <TextField
              form={form}
              name="email"
              label={t('fields.email')}
              type="email"
              autoComplete="email"
            />
            <FormError form={form} />
            <Button type="submit" disabled={forgot.isPending}>
              {t('forgot.submit')}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  );
}
