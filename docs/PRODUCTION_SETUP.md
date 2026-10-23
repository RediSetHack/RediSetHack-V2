# Production Setup Guide

How to deploy RediSetHack V2 to production. For a dev machine, see [LOCAL_SETUP.md](LOCAL_SETUP.md).

The repo does not prescribe a host. The deployable units are the two Docker images (`apps/api/Dockerfile`, `apps/web/Dockerfile`) plus a managed Postgres, so this works on any container platform (Fly.io, Railway, Render, ECS, a VPS with Docker, ...).

`main` is the production branch; it only receives promotion PRs from `develop` (see [branch-protection.md](branch-protection.md)).

## Deployment notes

- **CORS:** the API only accepts browser calls from `WEB_ORIGIN` (default `http://localhost:3000`). Set it to your web origin, for example `https://app.example.com`; comma-separate several origins.
- **Web build args:** `NEXT_PUBLIC_*` are inlined at build time and `.env` is excluded from the Docker context, so pass `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` with `--build-arg` when building the web image.

## Architecture

```
Browser ──► Web (Next.js, :3000) ──► API (NestJS, :3001) ──► Postgres 17
   │                                    ▲
   └──► Clerk (auth)  ──webhook────────┘  POST /v1/api/clerk/webhook
```

Put each public service behind HTTPS (platform TLS or a reverse proxy). The API must be reachable from users' browsers, since the web app calls it with `NEXT_PUBLIC_API_URL`.

## 1. Database

1. Provision a managed Postgres 17 (or compatible) instance with backups on.
2. Create a dedicated app user and database; do **not** use the `postgres:postgres` defaults from `docker-compose.yml`.
3. Build the connection string. Require TLS if the provider supports it:
   ```
   DATABASE_URL=postgres://<user>:<password>@<host>:5432/<db>?sslmode=require
   ```
4. Apply the schema with **migrations**, not `db:push` (push is for local dev and can drop data):
   ```sh
   DATABASE_URL=... pnpm --filter @repo/db db:migrate
   ```
   CI already uses `db:migrate` against its test database. Run this as a release step, before the new API version starts.
5. Seed the base content once on a fresh database:
   ```sh
   pnpm --filter @repo/db build
   DATABASE_URL=... pnpm db:seed
   ```
   Do **not** run `db:seed:demo` in production; it loads demo data.

## 2. Clerk (production instance)

1. In the Clerk Dashboard, create a **Production** instance (separate from your dev one) and attach your domain. Clerk will give you DNS records to add.
2. Copy the live keys: `pk_live_...` and `sk_live_...`. Dev keys (`pk_test_`/`sk_test_`) must not be used in production.
3. Configure the **session token** claims, same as dev:
   ```json
   {
     "email": "{{user.primary_email_address}}",
     "name": "{{user.full_name}}"
   }
   ```
4. Add the **webhook**: endpoint `https://<api-domain>/v1/api/clerk/webhook`, events `user.deleted` (required: erases the learner's data when the Clerk account is deleted), plus `user.created` and `user.updated` (backstop for email/role changes; signup itself syncs via `/v1/api/user/sync`). Copy the signing secret (`whsec_...`) into `CLERK_WEBHOOK_SECRET`. Without it the endpoint answers 503 and Clerk-side deletions never reach the database; the API still boots and login works.
5. Production users are separate from dev users, so re-assign roles there (see [Roles](#7-roles-in-production)).

## 3. Environment variables

Set these in your platform's secret store. Never commit them, and do not bake secrets into images.

### API container

| Variable | Required | Value |
| --- | --- | --- |
| `NODE_ENV` | **yes** | `production`. Also turns off the Swagger `/docs` page. The image sets it already. |
| `PORT` | no | `3001` (image default). |
| `DATABASE_URL` | **yes** | Managed Postgres URL from step 1. |
| `CLERK_SECRET_KEY` | **yes** | `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | **yes** | `pk_live_...` |
| `CLERK_WEBHOOK_SECRET` | recommended | `whsec_...` from the production webhook. Optional for boot and login; needed for account-deletion sync. |
| `CODE_EXECUTION_API_URL` | no | Defaults to the public Piston API. Prefer a provider you control for production. |
| `CODE_EXECUTION_SANDBOX_VERIFIED` | no | Keep `false` unless you verified the provider's isolation. |
| `RESEARCH_PSEUDONYM_KEY` | only for research export | 32+ random chars (`openssl rand -hex 32`). Keep it stable: changing it changes the pseudonyms. |
| `WEB_ORIGIN` | **yes** | `https://<web-domain>`. Allowed CORS origin(s), comma-separated. |

### Web container

| Variable | When | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **build time** | `https://<api-domain>` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **build time** | `pk_live_...` |
| `CLERK_SECRET_KEY` | runtime | `sk_live_...` |

## 4. Build and run the images

Build from the **repo root** on a clean checkout of `main`:

```sh
docker build -f apps/api/Dockerfile -t <registry>/redisethack-api:<version> .

docker build -f apps/web/Dockerfile -t <registry>/redisethack-web:<version> \
  --build-arg NEXT_PUBLIC_API_URL=https://<api-domain> \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... .

docker push <registry>/redisethack-api:<version>
docker push <registry>/redisethack-web:<version>
```

Run them with your platform, injecting the env vars above at runtime:

```sh
docker run -d --restart unless-stopped -p 3001:3001 --env-file api.prod.env <registry>/redisethack-api:<version>
docker run -d --restart unless-stopped -p 3000:3000 --env-file web.prod.env <registry>/redisethack-web:<version>
```

Both images run as a non-root user and expose 3001 (API) and 3000 (web). Tag images with an immutable version (git SHA or release tag), not `latest`, so you can roll back.

## 5. Release checklist

Before promoting `develop` into `main`:

- [ ] CI is green on the promotion PR (lint, typecheck, migrate, test, build).
- [ ] New migrations were reviewed; none are destructive without a plan.
- [ ] Database backup/snapshot taken.

Deploy order:

1. Run `db:migrate` against production.
2. Deploy the API; check it boots and the startup log says `production` mode.
3. Deploy the web image (rebuild only if a `NEXT_PUBLIC_*` value or the code changed).
4. Smoke test: sign up, sign in, load the dashboard, finish one stage.

Roll back by redeploying the previous image tags. Migrations are forward-only, so keep schema changes backward compatible across one release (add columns first, remove them later).

## 6. Security and operations

- **Secrets:** only in the platform secret store; rotate `CLERK_SECRET_KEY` and `RESEARCH_PSEUDONYM_KEY` if leaked. The `.env.bak-*` files in a working copy are not for production and must not be copied to servers.
- **TLS everywhere:** web, API and the database connection.
- **Swagger:** off when `NODE_ENV=production`. Confirm `/docs` returns 404.
- **Code execution:** the Codelab runner executes learner code. Keep `CODE_EXECUTION_SANDBOX_VERIFIED=false` until you have tested isolation of your provider in a disposable environment.
- **Backups:** automated daily backups and one tested restore.
- **Monitoring:** alert on container restarts and API 5xx; check webhook delivery in the Clerk Dashboard (failed webhooks mean stale emails/roles in the `users` table).

## 7. Roles in production

Roles come from Clerk **`publicMetadata.role`** on the **production** instance (`admin`, `contributor`, otherwise `user`). Give the first admin in the Clerk Dashboard: **Users > the user > Public metadata**:

```json
{ "role": "admin" }
```

Contributors get `{ "role": "contributor" }`. The user must sign out and back in. Only grant `admin` to the maintainers, and review who holds it periodically. Details and the API alternative are in [LOCAL_SETUP.md](LOCAL_SETUP.md#4-roles-user-contributor-admin).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Browser shows CORS errors calling the API | `WEB_ORIGIN` is unset or does not match the web origin exactly (scheme, host, port, no trailing slash). |
| Web calls `localhost:3001` or Clerk fails to load | `NEXT_PUBLIC_*` were not passed with `--build-arg` at build time. |
| 401 on every API call | API and web use keys from different Clerk instances, or dev keys in prod. |
| 503 on `/v1/api/clerk/webhook` | `CLERK_WEBHOOK_SECRET` not set on the API. |
| Webhook returns 401 | Wrong signing secret, or the proxy altered the raw request body. |
| API cannot connect to the DB | `DATABASE_URL`, `sslmode`, firewall/allow-list for the API host. |
| Empty content after deploy | Base seed (`db:seed`) was never run. |
