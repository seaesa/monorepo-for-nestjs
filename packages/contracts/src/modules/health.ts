import { z } from 'zod';

import { defineRoute } from '../route';

const indicatorSchema = z.object({ status: z.string() }).loose();

export const healthSchema = z.object({
  status: z.enum(['ok', 'error']),
  info: z.record(z.string(), indicatorSchema).optional(),
  error: z.record(z.string(), indicatorSchema).optional(),
  /** Terminus echoes the flat indicator map here; kept so the wire shape is explicit. */
  details: z.record(z.string(), indicatorSchema).optional(),
});

export const healthRoutes = {
  check: defineRoute({ method: 'GET', path: '/health', auth: false, response: healthSchema }),
};
