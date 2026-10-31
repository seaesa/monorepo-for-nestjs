import type { PaginationMeta } from '@repo/contracts';

interface Page {
  page: number;
  limit: number;
}

/** Prisma `skip`/`take` for a parsed `paginationQuerySchema`. */
export function pageArgs({ page, limit }: Page): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

export function pageMeta({ page, limit }: Page, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
