import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { FieldError } from '@/components/ui/field';

/** Errors not bound to a field (set by `setServerErrors` under `root.server`). */
export function FormError<T extends FieldValues>({
  form,
}: {
  form: UseFormReturn<T, unknown, unknown>;
}) {
  return <FieldError errors={[form.formState.errors.root?.server]} />;
}
