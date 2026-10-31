'use client';

import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { dayjs, setServerErrors, useCreateTaskMutation, useZodForm } from '@repo/client';
import { createTaskSchema } from '@repo/contracts';

import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

/** `<input type="datetime-local">` speaks local wall time; the contract speaks ISO instants. */
const toLocalInput = (iso: string | null | undefined) =>
  iso ? dayjs(iso).format('YYYY-MM-DDTHH:mm') : '';
const fromLocalInput = (value: string) => (value ? dayjs(value).toISOString() : null);

export function TaskCreateForm() {
  const { t } = useTranslation('tasks');
  const form = useZodForm(createTaskSchema, { defaultValues: { title: '', dueAt: null } });
  const create = useCreateTaskMutation();

  const onSubmit = form.handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: () => form.reset(),
      onError: (error) => setServerErrors(form, error),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <TextField form={form} name="title" label={t('new')} />
      </div>
      <Controller
        control={form.control}
        name="dueAt"
        render={({ field }) => (
          <Field className="w-auto">
            <FieldLabel htmlFor="dueAt">{t('fields.dueAt')}</FieldLabel>
            <Input
              id="dueAt"
              type="datetime-local"
              value={toLocalInput(field.value)}
              onChange={(event) => field.onChange(fromLocalInput(event.target.value))}
            />
          </Field>
        )}
      />
      <Button type="submit" disabled={create.isPending}>
        {t('actions.create', { ns: 'common' })}
      </Button>
      <div className="basis-full">
        <FormError form={form} />
      </div>
    </form>
  );
}
