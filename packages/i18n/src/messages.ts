import type { TFunction } from 'i18next';
import type { z } from 'zod';

import { ErrorCode, type FieldError, issueParams, ValidationMessage } from '@repo/contracts';

import type { en } from './locales/en';

type ValidationKey = keyof typeof en.validation;

const errorCodes = new Set<string>(Object.values(ErrorCode));
const validationMessages = new Set<string>(Object.values(ValidationMessage));

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && errorCodes.has(value);
}

function isValidationMessage(value: unknown): value is ValidationMessage {
  return typeof value === 'string' && validationMessages.has(value);
}

function sizeOrigin(origin: unknown): 'string' | 'number' | 'array' | undefined {
  if (origin === 'string') return 'string';
  if (origin === 'number' || origin === 'bigint' || origin === 'int') return 'number';
  if (origin === 'array' || origin === 'set') return 'array';
  return undefined;
}

/** Maps a zod issue code + params to a `validation` key. */
export function validationKey(code: string, params: FieldError['params'] = {}): ValidationKey {
  switch (code) {
    case 'too_small': {
      const origin = sizeOrigin(params.origin);
      if (origin === 'string' && params.minimum === 1) return 'required';
      return origin ? `too_small_${origin}` : 'invalid';
    }
    case 'too_big': {
      const origin = sizeOrigin(params.origin);
      return origin ? `too_big_${origin}` : 'invalid';
    }
    case 'invalid_format':
      if (params.format === 'email') return 'invalid_format_email';
      if (params.format === 'url') return 'invalid_format_url';
      return 'invalid_format';
    case 'invalid_type':
    case 'invalid_value':
      return code;
    default:
      return 'invalid';
  }
}

/** Text for a field error from the API or from local zod validation. */
export function translateFieldError(
  t: TFunction,
  error: Pick<FieldError, 'code' | 'message' | 'params'>,
): string {
  if (isValidationMessage(error.message)) return t(error.message, { ns: 'validation' });
  if (isErrorCode(error.code)) return t(error.code, { ns: 'errors' });
  const { minimum = '', maximum = '' } = error.params ?? {};
  return t(validationKey(error.code, error.params), {
    ns: 'validation',
    minimum: String(minimum),
    maximum: String(maximum),
  });
}

/** Text for any thrown error: translated by `code` when it carries one we know. */
export function translateError(t: TFunction, error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  return t(isErrorCode(code) ? code : ErrorCode.INTERNAL_ERROR, { ns: 'errors' });
}

/** Zod error map that renders built-in issues in the active language. */
export function zodErrorMap(t: TFunction): z.core.$ZodErrorMap {
  return (issue) =>
    translateFieldError(t, {
      code: issue.code ?? 'custom',
      message: '',
      params: issueParams(issue),
    });
}

/** Schemas pass `ValidationMessage` keys as custom messages; this turns them into text. */
export function translateValidationMessage(t: TFunction, message: string): string {
  return isValidationMessage(message) ? t(message, { ns: 'validation' }) : message;
}
