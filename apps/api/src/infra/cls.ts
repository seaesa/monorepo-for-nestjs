import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ClsModule } from 'nestjs-cls';

import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';

/** Request-scoped context; carries the Prisma transaction across services for `@Transactional()`. */
export const clsModule = ClsModule.forRoot({
  global: true,
  middleware: { mount: true },
  plugins: [
    new ClsPluginTransactional({
      imports: [PrismaModule],
      adapter: new TransactionalAdapterPrisma({ prismaInjectionToken: PrismaService }),
    }),
  ],
});
