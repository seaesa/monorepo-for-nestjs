'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { setServerErrors, useRegisterMutation, useZodForm } from '@repo/client';
import { registerSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';

import { AuthCard } from './auth-card';

export function RegisterForm() {
  const { t } = useTranslation('auth');
  const form = useZodForm(registerSchema, { defaultValues: { name: '', email: '', password: '' } });
  const register = useRegisterMutation();

  const onSubmit = form.handleSubmit((values) =>
    register.mutate(values, { onError: (error) => setServerErrors(form, error) }),
  );

  return (
    <AuthCard
      title={t('register.title')}
      footer={
        <>
          {t('register.hasAccount')}&nbsp;
          <Link href="/login" className="text-foreground underline">
            {t('login.submit')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <TextField form={form} name="name" label={t('fields.name')} autoComplete="name" />
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
            autoComplete="new-password"
          />
          <FormError form={form} />
          <Button type="submit" disabled={register.isPending}>
            {t('register.submit')}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
