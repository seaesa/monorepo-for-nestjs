import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';

import { defineRoute, buildPath } from './route';

describe('buildPath', () => {
  it('fills in a single parameter', () => {
    expect(buildPath('/users/:id', { id: 'user-1' })).toBe('/users/user-1');
  });

  it('fills in several parameters and encodes them', () => {
    const path = buildPath('/orgs/:orgId/members/:id', { orgId: 'a b', id: 'c/d' });
    expect(path).toBe('/orgs/a%20b/members/c%2Fd');
  });

  it('returns static paths untouched', () => {
    expect(buildPath('/auth/me')).toBe('/auth/me');
    expect(buildPath('/users', {})).toBe('/users');
  });

  it('throws when a parameter is missing instead of sending a broken URL', () => {
    expect(() => buildPath('/users/:id', {})).toThrow('Missing path param "id"');
  });
});

describe('defineRoute', () => {
  it('keeps the declaration as written, so types stay narrow', () => {
    const route = defineRoute({
      method: 'GET',
      path: '/users/:id',
      response: z.object({ id: z.uuid() }),
    });
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/users/:id');
    // Public routes must opt out explicitly; anything else defaults to protected.
    expect(route.auth).toBeUndefined();
  });
});
