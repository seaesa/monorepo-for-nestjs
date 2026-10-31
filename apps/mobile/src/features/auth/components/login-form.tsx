import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { setServerErrors, useLoginMutation, useZodForm } from '@repo/client';
import { loginSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export function LoginForm() {
  const { t } = useTranslation('auth');
  const form = useZodForm(loginSchema, { defaultValues: { email: '', password: '' } });
  const login = useLoginMutation();

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, { onError: (error) => setServerErrors(form, error) }),
  );

  return (
    <View className="gap-4">
      <Text variant="h3">{t('login.title')}</Text>
      <TextField
        form={form}
        name="email"
        label={t('fields.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField
        form={form}
        name="password"
        label={t('fields.password')}
        secureTextEntry
        autoComplete="current-password"
      />
      <FormError form={form} />
      <Button disabled={login.isPending} onPress={() => void onSubmit()}>
        <Text>{t('login.submit')}</Text>
      </Button>
      <Link href="/register" className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')} {t('register.submit')}
      </Link>
    </View>
  );
}
