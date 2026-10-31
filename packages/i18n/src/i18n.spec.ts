import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';

import { ErrorCode, ValidationMessage } from '@repo/contracts';

import { createI18n } from './i18n';
import { resolveLocale } from './locale';
import { en } from './locales/en';
import { vi } from './locales/vi';
import { translateError, translateFieldError, zodErrorMap } from './messages';

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? keysOf(child as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('dictionaries', () => {
  it('vi has exactly the keys of en', () => {
    expect(keysOf(vi).toSorted()).toEqual(keysOf(en).toSorted());
  });

  it('every error code and validation message has text', () => {
    for (const code of Object.values(ErrorCode)) expect(en.errors[code]).toBeTruthy();
    for (const key of Object.values(ValidationMessage)) expect(en.validation[key]).toBeTruthy();
  });
});

describe('resolveLocale', () => {
  it('picks the first supported language from a header or device tags', () => {
    expect(resolveLocale('fr-FR,vi-VN;q=0.9,en;q=0.8')).toBe('vi');
    expect(resolveLocale(['de', 'en-US'])).toBe('en');
  });

  it('falls back to the default locale', () => {
    expect(resolveLocale('fr')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
  });
});

describe('translations', () => {
  const t = createI18n('vi').t;

  it('translates API errors by code and unknown errors as internal', () => {
    expect(translateError(t, { code: ErrorCode.AUTH_EMAIL_TAKEN })).toBe(
      vi.errors.AUTH_EMAIL_TAKEN,
    );
    expect(translateError(t, new Error('boom'))).toBe(vi.errors.INTERNAL_ERROR);
  });

  it('translates field errors with their params', () => {
    const fieldError = { code: 'too_small', message: '', params: { origin: 'string', minimum: 8 } };
    expect(translateFieldError(t, fieldError)).toBe('Tối thiểu 8 ký tự.');
    expect(
      translateFieldError(t, {
        code: 'too_small',
        message: '',
        params: { origin: 'string', minimum: 1 },
      }),
    ).toBe(vi.validation.required);
    expect(
      translateFieldError(t, { code: 'custom', message: ValidationMessage.PASSWORD_DIGIT }),
    ).toBe(vi.validation.password_digit);
  });

  it('renders zod issues in the active language', () => {
    const result = z
      .string()
      .email()
      .safeParse('nope', { error: zodErrorMap(t) });
    expect(result.error?.issues[0]?.message).toBe(vi.validation.invalid_format_email);
  });
});
