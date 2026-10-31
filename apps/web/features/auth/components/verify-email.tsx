'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useVerifyEmailMutation } from '@repo/client';
import { translateError } from '@repo/i18n';

import { FieldDescription, FieldError } from '@/components/ui/field';

import { AuthCard } from './auth-card';

export function VerifyEmail({ token }: { token: string }) {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation();
  const { mutate, isSuccess, error } = useVerifyEmailMutation();

  useEffect(() => {
    mutate({ token });
  }, [mutate, token]);

  return (
    <AuthCard title={t('verify.title')}>
      {error ? (
        <FieldError>{translateError(tCommon, error)}</FieldError>
      ) : (
        <FieldDescription>{isSuccess ? t('verify.done') : t('verify.pending')}</FieldDescription>
      )}
    </AuthCard>
  );
}
