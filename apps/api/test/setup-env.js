// e2e tests run against the docker-compose infra (`pnpm infra:up`) using apps/api/.env.
try {
  process.loadEnvFile(require('node:path').join(__dirname, '..', '.env'));
} catch {
  // CI provides env vars directly.
}
process.env.LOG_LEVEL = 'error';
