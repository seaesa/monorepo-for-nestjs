import { router } from 'expo-router';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { setServerErrors, useCreateTaskMutation, useZodForm } from '@repo/client';
import { createTaskSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { DueDateField } from './due-date-field';
import { LocationField } from './location-field';

export function TaskCreateForm() {
  const { t } = useTranslation('tasks');
  const form = useZodForm(createTaskSchema, {
    defaultValues: { title: '', description: null, dueAt: null, location: null },
  });
  const create = useCreateTaskMutation();

  const onSubmit = form.handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: () => router.back(),
      onError: (error) => setServerErrors(form, error),
    }),
  );

  return (
    <View className="gap-4">
      <TextField form={form} name="title" label={t('fields.title')} />
      <TextField
        form={form}
        name="description"
        label={t('fields.description')}
        multiline
        className="h-24"
      />
      <Controller
        control={form.control}
        name="dueAt"
        render={({ field }) => <DueDateField value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={form.control}
        name="location"
        render={({ field }) => <LocationField value={field.value} onChange={field.onChange} />}
      />
      <FormError form={form} />
      <Button disabled={create.isPending} onPress={() => void onSubmit()}>
        <Text>{t('actions.create', { ns: 'common' })}</Text>
      </Button>
    </View>
  );
}
