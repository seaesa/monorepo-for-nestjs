import 'server-only';

import { cookies, headers } from 'next/headers';

import type { Locale } from '@repo/contracts';
import { isLocale, resolveLocale } from '@repo/i18n';

import { LOCALE_COOKIE } from './cookies';

/** The user's explicit choice (cookie) wins over the browser's `Accept-Language`. */
export async function getRequestLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return resolveLocale((await headers()).get('accept-language'));
}
