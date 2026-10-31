import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface TextFieldProps<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  'form' | 'name'
> {
  form: UseFormReturn<T, unknown, unknown>;
  name: Path<T>;
  label: string;
}

/** Label + input + translated error, bound to a `useZodForm` form. */
export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  ...input
}: TextFieldProps<T>) {
  const error = form.getFieldState(name, form.formState).error;
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input id={name} aria-invalid={Boolean(error)} {...input} {...form.register(name)} />
      <FieldError errors={[error]} />
    </Field>
  );
}
