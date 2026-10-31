import { subject } from '@casl/ability';

import type { AuthUser } from '../auth';
import { defineAbilityFor } from './ability';

const user: AuthUser = { id: 'u1', email: 'u1@example.com', role: 'USER' };
const admin: AuthUser = { id: 'a1', email: 'a1@example.com', role: 'ADMIN' };
const task = (ownerId: string) => subject('Task', { ownerId } as never);

describe('defineAbilityFor', () => {
  it('lets a user manage only their own tasks', () => {
    const ability = defineAbilityFor(user);

    for (const action of ['read', 'update', 'delete'] as const) {
      expect(ability.can(action, task('u1'))).toBe(true);
      expect(ability.can(action, task('someone-else'))).toBe(false);
    }
  });

  it('lets an admin manage every task', () => {
    expect(defineAbilityFor(admin).can('delete', task('someone-else'))).toBe(true);
  });
});
