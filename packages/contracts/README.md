# @repo/contracts

Single source of truth for API boundary types between `apps/api` and
`apps/web`. Each schema is a [Zod](https://zod.dev) object that produces both
a runtime validator and, via `z.infer`, its TypeScript type from one
definition. See [ADR 0004](../../docs/adr/0004-shared-contract-types.md) for
why this exists and what it replaces.

This package has **no dependency on `@repo/db`** — the API response shape is
intentionally decoupled from the DB column shape.

## Structure

```
src/
  constants/   shared constants and enums (ships with this package)
  auth/        per-domain schemas, added as auth endpoints adopt Zod
  content/     per-domain schemas, added as content endpoints adopt Zod
  progress/    per-domain schemas, added as progress endpoints adopt Zod
  badges/      per-domain schemas, added as badges endpoints adopt Zod
  index.ts     barrel re-export of every domain
```

Domain directories are created **as features need them** — schemas are grown
per feature (see #52 and ADR 0004), not written up front as a speculative
catalogue.

## Exports

- `@repo/contracts` — the barrel, re-exporting every domain plus constants.
- `@repo/contracts/constants` — shared constants and enums only.
- `@repo/contracts/<domain>` — a single domain's schemas, once it exists
  (e.g. `@repo/contracts/content`).

Add a domain's subpath to `package.json#exports` and a re-export line to
`src/index.ts` when that domain's first schema is added.

## Verification convention

There is no separate contract test suite. A domain's schemas are proved by
the API integration spec that already covers the routes producing that
shape: the spec parses the HTTP response through the schema, so a presenter
that drifts from the schema fails a test that already exercises it, and
`apps/web`'s inferred types move with the schema change. This package's own
Vitest suite covers only its constants and the general schema convention
(valid payloads parse, invalid payloads throw `ZodError`).

## Adoption

`apps/api` adopts Zod incrementally. Existing `class-validator` request DTOs
are untouched — Zod here covers response contracts, not request validation.
