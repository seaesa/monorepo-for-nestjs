import { defaultLocale, type Locale, localeSchema } from '@repo/contracts';

export function isLocale(value: unknown): value is Locale {
  return localeSchema.safeParse(value).success;
}

/**
 * Best supported locale for an `Accept-Language` header or a device tag (`vi-VN`, `en;q=0.8`).
 * Order of preference is the order of the list; quality values are not re-sorted.
 */
export function resolveLocale(preferred: string | readonly string[] | null | undefined): Locale {
  const tags = typeof preferred === 'string' ? preferred.split(',') : (preferred ?? []);
  for (const tag of tags) {
    const language = tag.trim().split(';')[0]?.split('-')[0]?.toLowerCase();
    if (isLocale(language)) return language;
  }
  return defaultLocale;
}
