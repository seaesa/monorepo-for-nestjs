# Next.js web app. Build from the repo root:
#   docker build -f apps/web/Dockerfile -t web .

FROM node:26-alpine AS base
RUN npm install -g pnpm@12.14.0
WORKDIR /repo

# Prune the monorepo down to `web` and its workspace dependencies.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.10 prune web --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
# NEXT_PUBLIC_* values are inlined into the client bundle, so pass them as build args:
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT \
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=$NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
RUN pnpm turbo run build --filter=web...

FROM node:26-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
# `standalone` mirrors the workspace layout, hence the nested paths.
COPY --from=builder --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
USER app
EXPOSE 3001
CMD ["node", "apps/web/server.js"]
