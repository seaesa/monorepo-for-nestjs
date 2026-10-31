import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { setServerErrors, useRegisterMutation, useZodForm } from '@repo/client';
import { registerSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export function RegisterForm() {
  const { t } = useTranslation('auth');
  const form = useZodForm(registerSchema, { defaultValues: { name: '', email: '', password: '' } });
  const register = useRegisterMutation();

  const onSubmit = form.handleSubmit((values) =>
    register.mutate(values, { onError: (error) => setServerErrors(form, error) }),
  );

  return (
    <View className="gap-4">
      <Text variant="h3">{t('register.title')}</Text>
      <TextField form={form} name="name" label={t('fields.name')} autoComplete="name" />
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
        autoComplete="new-password"
      />
      <FormError form={form} />
      <Button disabled={register.isPending} onPress={() => void onSubmit()}>
        <Text>{t('register.submit')}</Text>
      </Button>
      <Link href="/login" className="text-center text-sm text-muted-foreground">
        {t('register.hasAccount')} {t('login.submit')}
      </Link>
    </View>
  );
}
