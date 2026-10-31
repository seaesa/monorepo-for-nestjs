import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

// Prisma CLI does not load .env itself. CI/Docker pass env vars directly.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Optional so `prisma generate` works without a database (Docker build, CI).
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
