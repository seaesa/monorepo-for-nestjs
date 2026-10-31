import { AbilityBuilder, type Ability } from '@casl/ability';
import { createPrismaAbility, type PrismaQueryOf, type Subjects } from '@casl/prisma/runtime';

import type { Prisma, Task } from '../../generated/prisma/client';
import type { AuthUser } from '../auth';

type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';
type Subject = Subjects<{ Task: Task }> | 'all';
type AppAbility = Ability<[Action, Subject], PrismaQueryOf<Prisma.TypeMap>>;

/**
 * Every permission in the system, in one place. A new model or role starts here; services ask
 * the ability (`accessibleBy(ability).ofType('Task')`) instead of hand-writing ownership filters.
 */
export function defineAbilityFor(user: AuthUser): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  if (user.role === 'ADMIN') {
    can('manage', 'all');
  } else {
    can('manage', 'Task', { ownerId: user.id });
  }

  return build();
}
