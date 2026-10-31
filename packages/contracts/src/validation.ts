/**
 * Keys for rules zod cannot name on its own (regex, refine). Schemas pass them as the custom
 * message; `@repo/i18n` translates them in the `validation` namespace (typed against this map).
 */
export const ValidationMessage = {
  PASSWORD_LETTER: 'password_letter',
  PASSWORD_DIGIT: 'password_digit',
  REQUIRED: 'required',
} as const;

export type ValidationMessage = (typeof ValidationMessage)[keyof typeof ValidationMessage];
