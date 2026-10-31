import { z } from 'zod';

import { limits } from './limits';

/** Dates travel as ISO strings. Accepts `Date` on the server so Prisma rows serialize directly. */
export const zDateTime = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.iso.datetime(),
);

export const zId = z.uuid();

/** Normalized (trimmed, lower-cased) email. */
export const zEmail = z.string().trim().toLowerCase().pipe(z.email());

export const idParamsSchema = z.object({ id: zId });

export const paginationQuerySchema = z.object({
  page: z.coerce.number<number>().int().min(1).default(1),
  limit: z.coerce
    .number<number>()
    .int()
    .min(1)
    .max(limits.pageSize.max)
    .default(limits.pageSize.default),
});
export type PaginationQuery = z.input<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginationMeta = z.output<typeof paginationMetaSchema>;

export function paginated<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), meta: paginationMetaSchema });
}

export const okResponseSchema = z.object({ ok: z.literal(true) });

export const locales = ['en', 'vi'] as const;
export const localeSchema = z.enum(locales);
export type Locale = z.output<typeof localeSchema>;
export const defaultLocale: Locale = 'en';
