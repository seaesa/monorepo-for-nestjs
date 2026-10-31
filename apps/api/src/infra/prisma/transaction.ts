import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import type { PrismaService } from './prisma.service';

/**
 * Inject `TransactionHost<PrismaTx>` and query through `db.tx`: it is the open transaction when
 * the caller runs inside `@Transactional()`, and the plain client otherwise.
 */
export type PrismaTx = TransactionalAdapterPrisma<PrismaService>;
