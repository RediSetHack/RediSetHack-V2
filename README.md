# RediSetHack

Turborepo monorepo: Next.js (Tailwind + shadcn/ui) frontend, NestJS API, Drizzle ORM on Postgres.

## Apps & packages

- `apps/web` — Next.js (App Router, Tailwind v4, shadcn/ui)
- `apps/api` — NestJS
- `packages/db` — Drizzle schema + client, shared by any app that talks to Postgres
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — shared config/packages

## Dev

```sh
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm turbo run db:push --filter=@repo/db   # apply schema
pnpm dev                                    # runs web + api
```

- web: http://localhost:3000
- api: http://localhost:3001

## Docker

```sh
docker compose up --build
```

Builds `apps/web` and `apps/api` via `turbo prune` for lean images, plus a `postgres` service.

## Add a shadcn component

```sh
cd apps/web && pnpm dlx shadcn@latest add <component>
```

## Team & Roles (Thesis Project)

This repository is developed as a **Thesis Project**.

- **Fullstack Developer & DevOps** (Maintainer & Lead)
- **Backend Developer** (`apps/api`, `packages/db`)
- **Frontend Developer** (`apps/web`, `packages/ui`)

## Development Workflow Rule

> **Mandatory Rule for All Features & Changes:**
> 1. **Branch Out**: Create a dedicated short-lived branch off `develop` (e.g. `feat/<feature-name>`, `fix/<issue-name>`). Never commit or push directly to `develop` or `main`.
> 2. **Use Git Worktrees**: Always create and work inside an isolated `git worktree` for the feature branch:
>    ```sh
>    git worktree add ../RediSetHack-<branch-name> -b <branch-name> develop
>    ```
> 3. **Open a Pull Request**: Submit a PR targeting `develop` for review and automated checks before merging.

