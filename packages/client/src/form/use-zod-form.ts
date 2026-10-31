import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import {
  type FieldErrors,
  type FieldValues,
  type Path,
  type Resolver,
  useForm,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { translateError, translateFieldError, translateValidationMessage } from '@repo/i18n';

import { toApiError } from '../http/api-error';
import { getAppT } from '../i18n/i18n';

/** Contract schemas carry `ValidationMessage` keys as custom messages; show them as text. */
function translateErrors(errors: FieldErrors, t: TFunction): void {
  for (const value of Object.values(errors)) {
    if (!value || typeof value !== 'object') continue;
    if (typeof value.message === 'string')
      value.message = translateValidationMessage(t, value.message);
    translateErrors(value as FieldErrors, t);
  }
}

/**
 * `useForm` pre-wired with the contract's zod schema — the same schema the API validates with.
 * Messages come out in the active language.
 * @example const form = useZodForm(loginSchema, { defaultValues: { email: '', password: '' } });
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, 'resolver'>,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  const { t } = useTranslation();
  const validate: Resolver<z.input<TSchema>, unknown, z.output<TSchema>> = zodResolver(
    schema as never,
  );
  const resolver: typeof validate = async (...args) => {
    const result = await validate(...args);
    translateErrors(result.errors, t);
    return result;
  };
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({ ...options, resolver });
}

/**
 * Maps an API error onto the form: field errors go to their inputs,
 * anything else goes to `errors.root.server`. Use in a mutation's `onError`.
 */
export function setServerErrors<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, 'setError' | 'getValues'>,
  error: unknown,
  t: TFunction = getAppT(),
): void {
  const apiError = toApiError(error);
  const values = form.getValues() as Record<string, unknown>;
  let applied = false;

  for (const fieldError of apiError.fieldErrors) {
    const root = fieldError.path.split('.')[0];
    if (root && root in values) {
      form.setError(fieldError.path as Path<T>, {
        type: fieldError.code,
        message: translateFieldError(t, fieldError),
      });
      applied = true;
    }
  }
  if (!applied)
    form.setError('root.server', { type: apiError.code, message: translateError(t, apiError) });
}
