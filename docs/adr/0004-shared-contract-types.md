# Shared contract types via a Zod package

For issue #51 (parent #49), a new `packages/contracts/` package published as
`@repo/contracts` is the single source of truth for API boundary types
between `apps/api` and `apps/web`. It uses [Zod](https://zod.dev) to define
schemas that produce both a runtime validator and, via `z.infer`, an inferred
TypeScript type from one definition.

## Alternatives considered

**(a) Shared Zod package — chosen.** One schema definition yields both the
runtime validator and the TypeScript type. Zod works unmodified in both the
NestJS API and the Next.js web app, so both sides import the same package.
Adoption is incremental: existing `class-validator` request DTOs in
`apps/api` are untouched, and Zod is introduced for response contracts only,
one endpoint at a time.

**(b) Re-export Drizzle `InferSelectModel` types from `@repo/db`.** Rejected
because the DB column shape is not the API response shape — presenters
reshape, omit, and combine columns before they reach the wire, and coupling
the contract to the schema would leak persistence details into the API
boundary and break the moment a migration changes a column that the API
response doesn't expose.

**(c) OpenAPI codegen (`openapi-typescript` or `orval`).** Rejected for this
project's size: it requires maintaining an OpenAPI spec (or deriving one from
decorators) as a separate artifact from the code that produces the response,
plus a codegen step in the build pipeline. The Zod-schema-as-source approach
gets the same type-safety with no spec to keep in sync and no generated code
to review.

**(d) Manual type duplication.** Rejected as the status quo failure mode this
ticket fixes: hand-written matching interfaces in `apps/api` and `apps/web`
drift silently, with no compiler or test failure when one side changes.

## Convention: schemas are grown per feature

This ticket establishes the package, its structure, its shared constants,
and this ADR — it does not add a catalogue of domain schemas. Per #52, each
frontend slice adds the schemas for the endpoints it actually consumes, at
the time it consumes them. Writing all domain schemas up front would produce
a layer with no consumer, tested only against itself.

Domain directories (`auth/`, `content/`, `progress/`, `badges/`) mirror the
API's module structure and are created as features need them.

## Convention: verified inside the API integration specs

There is no separate contract test suite for domain schemas. The API's
existing module integration specs parse their own HTTP responses through the
relevant schema from `@repo/contracts`. This means the seam that already
asserts route behaviour also asserts response shape: a presenter that
changes shape fails the integration test that already exercises it, and
`apps/web`'s inferred types move with the schema change. Every later ticket
that adds a domain schema follows this same verification convention.

`packages/contracts`'s own test suite covers only its shared constants and
the general schema convention (a valid payload parses, an invalid payload
throws `ZodError`) — not domain-specific schemas.
