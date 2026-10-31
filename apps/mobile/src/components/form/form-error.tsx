import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { Text } from '@/components/ui/text';

/** Errors not bound to a field (set by `setServerErrors` under `root.server`). */
export function FormError<T extends FieldValues>({
  form,
}: {
  form: UseFormReturn<T, unknown, unknown>;
}) {
  const message = form.formState.errors.root?.server?.message;
  return message ? <Text className="text-sm text-destructive">{message}</Text> : null;
}
