import type { ValidationMessage } from '@repo/contracts';

/** Keys: zod issue codes (refined by origin/format, see `validationKey`) + `ValidationMessage`. */
export const validation = {
  required: 'This field is required.',
  password_letter: 'Must contain a letter.',
  password_digit: 'Must contain a number.',
  invalid: 'This value is invalid.',
  invalid_type: 'This value is invalid.',
  invalid_value: 'Choose one of the allowed values.',
  invalid_format: 'The format is invalid.',
  invalid_format_email: 'Enter a valid email address.',
  invalid_format_url: 'Enter a valid URL.',
  too_small_string: 'Must be at least {{minimum}} characters.',
  too_small_number: 'Must be at least {{minimum}}.',
  too_small_array: 'Choose at least {{minimum}}.',
  too_big_string: 'Must be at most {{maximum}} characters.',
  too_big_number: 'Must be at most {{maximum}}.',
  too_big_array: 'Choose at most {{maximum}}.',
} as const satisfies Record<ValidationMessage, string> & Record<string, string>;
