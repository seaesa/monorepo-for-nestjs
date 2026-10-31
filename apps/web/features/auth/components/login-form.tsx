'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { setServerErrors, useLoginMutation, useZodForm } from '@repo/client';
import { loginSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';

import { AuthCard } from './auth-card';

export function LoginForm() {
  const { t } = useTranslation('auth');
  const form = useZodForm(loginSchema, { defaultValues: { email: '', password: '' } });
  const login = useLoginMutation();

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, { onError: (error) => setServerErrors(form, error) }),
  );

  return (
    <AuthCard
      title={t('login.title')}
      footer={
        <>
          {t('login.noAccount')}&nbsp;
          <Link href="/register" className="text-foreground underline">
            {t('register.submit')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <TextField
            form={form}
            name="email"
            label={t('fields.email')}
            type="email"
            autoComplete="email"
          />
          <TextField
            form={form}
            name="password"
            label={t('fields.password')}
            type="password"
            autoComplete="current-password"
          />
          <FormError form={form} />
          <Button type="submit" disabled={login.isPending}>
            {t('login.submit')}
          </Button>
          <Link href="/forgot-password" className="text-sm text-muted-foreground underline">
            {t('forgot.link')}
          </Link>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
