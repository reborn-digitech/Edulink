# The web app as one container: build the workspace, keep only what the
# standalone output traced. Run from the repository root:
#
#   docker build -f apps/web/Dockerfile -t edulink-web .
#
# The image carries no .env; every setting comes from the host's secret store
# (see docs/runbooks/deploy.md) and env.ts refuses to serve a half-configured
# one. Migrations run as a release step, never at container start.
FROM node:24-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# openssl in every stage: Prisma detects the OpenSSL version to pick its query
# engine, and without it the build stage guessed 1.1.x for a runtime that has 3.0.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/i18n/package.json packages/i18n/
COPY packages/contracts/package.json packages/contracts/
COPY packages/api-client/package.json packages/api-client/
# patchedDependencies in package.json (LOAD-3: Prisma's per-access field map) must be present for a frozen install.
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /repo
COPY . .
ARG APP_COMMIT=unknown
ENV NEXT_TELEMETRY_DISABLED=1 APP_COMMIT=$APP_COMMIT
# The browser's push key is fixed into the client bundle by `next build`: a
# NEXT_PUBLIC_ value set only at runtime never reaches a browser, and the push
# switch says push is not configured. Pass the PUBLIC half of the deployment's
# pair (`--build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=…`); the private half stays a
# runtime secret. The server compares the two at boot (env.ts), so an image
# built with another pair's key refuses to start rather than fail every push.
# An ARG, not an ENV: the build sees it as an environment variable, and an
# EMPTY one is unset first — Next inlines a NEXT_PUBLIC_ value even when it is
# "", which would hide the runtime key from the server too. Built without it,
# a deployed server says so at boot (env.ts) and serves without browser push.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
# `next build` no longer type-checks or lints (next.config.ts, 4 Oct 2026: its worker ran out of heap at 184 models);
# the battery job runs tsc and eslint before this image is built, so the tree here has passed both. 8 GB is for the build
# itself, the same number as the package's build script (it ran out at 4 GB in CI's image job on 2 November 2026).
RUN cd apps/web && npx prisma generate \
  && if [ -z "${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-}" ]; then unset NEXT_PUBLIC_VAPID_PUBLIC_KEY; fi \
  && npm run build

# MEMORY: give each container at least 4 GB (LOAD-8, 4 Oct 2026). One server
# process measured 1.1 GB resident after start, 1.4-2.5 GB under the school
# load profiles and 3.1-3.6 GB under the college profiles, back to 1.4 GB idle,
# with no leak over 25 minutes; a 1-2 GB limit is killed at the first busy
# hour. One process per container (`node server.js`), one container per two
# vCPUs: the process saturates one core's main thread and uses one to two more
# for GC and libuv (195-294 % CPU at saturation). Scale with containers, each
# with `connection_limit=15` on DATABASE_URL (docs/runbooks/go-live.md 3.4, 9.6).
# No compression here: the proxy in front compresses (next.config.ts `compress`).
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
ARG APP_COMMIT=unknown
ENV APP_COMMIT=$APP_COMMIT
# psql for the release step's grants script, openssl for Prisma's engine (it
# warns and guesses without it); nothing else from apt.
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
# The Prisma CLI for the release step, installed as a package rather than
# copied: pnpm's `.bin/prisma` is a shim whose relative path points nowhere
# once it leaves the store (the first CI run of this image found
# /usr/local/prisma/build/index.js missing). Pinned to the client's version.
RUN npm install -g prisma@6.19.3

RUN groupadd --system app && useradd --system --gid app --create-home app
# The traced server, its static assets, and the pieces the release step needs.
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /repo/apps/web/public ./apps/web/public
COPY --from=build --chown=app:app /repo/apps/web/prisma ./apps/web/prisma
COPY --from=build --chown=app:app /repo/apps/web/scripts/with-admin-db.mjs /repo/apps/web/scripts/db-fence.mjs /repo/apps/web/scripts/db-grants.mjs /repo/apps/web/scripts/pg-url.mjs /repo/apps/web/scripts/db-role-check.mjs /repo/apps/web/scripts/jobs-runner.mjs ./apps/web/scripts/
USER app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "server.js"]
