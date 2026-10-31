# One image, two roles:
#   API:    docker run <image>                      (node dist/main.js)
#   Worker: docker run <image> node dist/worker.js
# Build from the repo root: docker build -f apps/api/Dockerfile -t api .

FROM node:26-alpine AS base
RUN npm install -g pnpm@12.14.0
WORKDIR /repo

# Prune the monorepo down to `api` and its workspace dependencies.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.10 prune api --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm turbo run build --filter=api... \
  && pnpm --filter api deploy --prod --legacy --ignore-scripts /app

FROM node:26-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app ./
USER app
EXPOSE 3000
CMD ["node", "dist/main.js"]
