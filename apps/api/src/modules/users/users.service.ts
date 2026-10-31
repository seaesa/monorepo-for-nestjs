import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import type { Locale } from '@repo/contracts';

import type { User } from '../../generated/prisma/client';
import type { PrismaTx } from '../../infra/prisma/transaction';

@Injectable()
export class UsersService {
  constructor(private readonly db: TransactionHost<PrismaTx>) {}

  findById(id: string): Promise<User | null> {
    return this.db.tx.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.db.tx.user.findUnique({ where: { email } });
  }

  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    locale: Locale;
  }): Promise<User> {
    return this.db.tx.user.create({ data });
  }

  update(userId: string, data: { name?: string; locale?: Locale }): Promise<User> {
    return this.db.tx.user.update({ where: { id: userId }, data });
  }

  updatePasswordHash(userId: string, passwordHash: string): Promise<User> {
    return this.db.tx.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  /** Idempotent: a second verification keeps the original timestamp. */
  async markEmailVerified(userId: string): Promise<User | null> {
    await this.db.tx.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    return this.findById(userId);
  }
}
