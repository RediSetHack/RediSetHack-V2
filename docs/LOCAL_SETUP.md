# Local Setup Guide

How to run RediSetHack V2 on your machine, which environment variables you need, and how to give yourself the `user`, `contributor` and `admin` roles.

## Stack at a glance

| Piece | Where | Port |
| --- | --- | --- |
| Web (Next.js) | `apps/web` | 3000 |
| API (NestJS) | `apps/api` | 3001 |
| Database (Postgres 17 + Drizzle) | `packages/db` | 5432 |
| Auth | [Clerk](https://clerk.com) (hosted, see [ADR 0002](adr/0002-clerk-authentication.md)) | n/a |

## Prerequisites

- **Node.js >= 24** and **pnpm 11** (`corepack enable` picks the pinned version from `package.json`)
- **Git**
- **Docker** (required for the Docker path; also the easiest way to get Postgres on the non-Docker path)
- A free **Clerk** account: https://dashboard.clerk.com

## 1. Clerk setup (both paths)

1. Create a Clerk application (any name, enable Email sign-in).
2. From **API Keys**, copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
3. In the Clerk Dashboard, open **Configure > Sessions > Customize session token** and add these claims, so the API can verify tokens without calling Clerk on every request (the API falls back to the Clerk Backend SDK if they are missing):
   ```json
   {
     "email": "{{user.primary_email_address}}",
     "name": "{{user.full_name}}"
   }
   ```
4. Optional, only if you want webhooks locally: add an endpoint to `POST <public-url>/v1/api/clerk/webhook` for `user.created` and `user.updated`, and copy its signing secret (`whsec_...`). Locally this is not needed, because the web app calls `POST /v1/api/user/sync` after sign-up.

## 2. Environment variables

There are three env files. Copy the template first: `cp .env.example .env`.

### Root `.env` and `apps/api/.env` (API and DB tooling)

The API reads `apps/api/.env`; the `packages/db` scripts look for a `.env` at the repo root (or the package). Keep the same values in both.

| Variable | Required | Example / default | Notes |
| --- | --- | --- | --- |
| `PORT` | no | `3001` | API port. |
| `WEB_ORIGIN` | no | `http://localhost:3000` | Browser origin(s) allowed by CORS, comma-separated. |
| `NODE_ENV` | no | `development` | |
| `DATABASE_URL` | **yes** | `postgres://postgres:postgres@localhost:5432/redisethack` | Matches `docker-compose.yml`. |
| `CLERK_SECRET_KEY` | **yes** | `sk_test_...` | Clerk > API Keys. |
| `CLERK_PUBLISHABLE_KEY` | **yes** | `pk_test_...` | Clerk > API Keys. |
| `CLERK_WEBHOOK_SECRET` | no (local) | `whsec_...` | Without it the webhook endpoint returns 503; fine for local dev. |
| `CODE_EXECUTION_API_URL` | no | `https://emkc.org/api/v2/piston` | Codelab runner; defaults to the public Piston API. |
| `CODE_EXECUTION_SANDBOX_VERIFIED` | no | `false` | Set `true` only after verifying provider isolation in a disposable environment. |
| `RESEARCH_PSEUDONYM_KEY` | no | 32+ random chars | Only needed for the admin research-export endpoint. Generate with `openssl rand -hex 32`. |

### `apps/web/.env`

| Variable | Required | Example / default | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **yes** | `pk_test_...` | Same publishable key as above. |
| `CLERK_SECRET_KEY` | **yes** | `sk_test_...` | Same secret key as above. |
| `CLERK_PUBLISHABLE_KEY` | **yes** | `pk_test_...` | |
| `DATABASE_URL` | yes | as above | Present in the current web env file. |
| `NEXT_PUBLIC_API_URL` | no | `http://localhost:3001` | Falls back to this default. **Inlined at build time.** |

Never commit real keys. `.env` files are git-ignored.

## 3A. Setup without Docker for the app (Postgres still needed)

You need a Postgres instance. Either use a local install, or run only the DB container (`docker compose up -d postgres`). With a local install, create the database yourself and adjust `DATABASE_URL`:

```sh
createdb redisethack
```

Then:

```sh
git clone https://github.com/RediSetHack/RediSetHack-V2.git
cd RediSetHack-V2

cp .env.example .env            # then fill in the Clerk keys
cp .env apps/api/.env
# create apps/web/.env with the web variables listed above

docker compose up -d postgres   # skip if you have a local Postgres
pnpm install

pnpm --filter @repo/db db:push                    # apply the schema
pnpm --filter @repo/db build && pnpm db:seed      # seed default data (db:seed runs dist/seed.js)
# optional richer demo data:
# pnpm --filter @repo/db db:seed:demo

pnpm dev                        # web + api via Turborepo
```

- Web: http://localhost:3000
- API: http://localhost:3001

Useful commands: `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm --filter @repo/db db:studio` (Drizzle Studio).

## 3B. Docker setup

`docker-compose.yml` currently defines **only the Postgres service** (`postgres:17-alpine`, user/password `postgres`, database `redisethack`, data in the `postgres-data` volume). The web and API each have a multi-stage `Dockerfile` (`turbo prune`, Node 24 Alpine, non-root user), built from the **repo root**.

```sh
# 1. Database
docker compose up -d postgres

# 2. Schema and seed (run on the host, against the container DB)
pnpm install
pnpm --filter @repo/db db:push
pnpm --filter @repo/db build && pnpm db:seed

# 3. API image
docker build -f apps/api/Dockerfile -t redisethack-api .
docker run --rm -p 3001:3001 --env-file apps/api/.env \
  -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/redisethack \
  --add-host=host.docker.internal:host-gateway \
  redisethack-api

# 4. Web image (see the build-time note below)
docker build -f apps/web/Dockerfile -t redisethack-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... .
docker run --rm -p 3000:3000 --env-file apps/web/.env redisethack-web
```

Things to know:

- **`.env` files are excluded from the build context** (`.dockerignore`), so secrets are passed at `docker run` time with `--env-file`, never baked into images.
- **`NEXT_PUBLIC_*` variables are inlined by Next.js at build time**, so pass them with `--build-arg` when building the web image (the Dockerfile declares both), not at `docker run`.
- Inside a container, `localhost` is the container itself, so the DB host must be `host.docker.internal` (as above) or a shared Docker network name.
- `README.md` says `docker compose up --build` builds the apps too. That does not match the current `docker-compose.yml`; follow this guide until the compose file gains app services.

## 4. Roles: user, contributor, admin

Roles are read from the Clerk user's **`publicMetadata.role`**. It can only be written from the Clerk Dashboard or Backend API, never by the user, so it is trusted. `unsafeMetadata` is deliberately ignored.

| Role | `publicMetadata` | Can do |
| --- | --- | --- |
| **user** (default) | nothing, or any other value | Learn: quests, stages, codelabs, profile, leaderboard. |
| **contributor** | `{ "role": "contributor" }` | Everything a user can, plus author **Drafts** (private lessons) and submit revisions for review (`/contribute`). Guarded by `ContributorGuard`. |
| **admin** | `{ "role": "admin" }` | Everything a contributor can, plus the admin shell, the review queue, content management endpoints, and the research export. Guarded by `AdminGuard`. |

### Assigning a role (Clerk Dashboard)

1. Sign up in the running app once, so the Clerk user exists.
2. Clerk Dashboard > **Users** > pick the user > **Public metadata** > **Edit**.
3. Paste one of:
   ```json
   { "role": "contributor" }
   ```
   ```json
   { "role": "admin" }
   ```
4. Save, then **sign out and back in** so a fresh session picks up the change.

To go back to a plain user, delete the `role` key.

### Assigning a role (Backend API, scriptable)

```sh
curl -X PATCH https://api.clerk.com/v1/users/<user_id>/metadata \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"role": "contributor"}}'
```

### How it is enforced

- `apps/api/src/modules/auth/domain/role.ts` maps `publicMetadata.role` to `admin | contributor | user`; anything else is `user`.
- `ContributorGuard` accepts `contributor` and `admin` (403 otherwise); `AdminGuard` is the admin check.
- Frontend menus (`/contribute`, `/admin`) are only conveniences; the API guards are the real boundary.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API fails to boot / DB errors | `docker compose ps` shows postgres healthy; `DATABASE_URL` matches; schema pushed. |
| Empty app, no characters/quests | Run the seed step (`pnpm --filter @repo/db build && pnpm db:seed`). |
| 401 from the API after login | API Clerk keys belong to the same Clerk app as the web keys. |
| 503 on `/v1/api/user/sync` | The Clerk user has no verified email. |
| 503 on `/v1/api/clerk/webhook` | `CLERK_WEBHOOK_SECRET` is unset. Expected locally. |
| Role change not visible | Sign out and in; confirm the value is under **public** metadata. |
| Web in Docker cannot reach Clerk/API | `NEXT_PUBLIC_*` must be passed at **build** time. |

## Contributing

Branch off `develop`, work in a git worktree, and open a PR to `develop`. Never push to `develop` or `main` directly. See the root `README.md` and `CLAUDE.md`.
